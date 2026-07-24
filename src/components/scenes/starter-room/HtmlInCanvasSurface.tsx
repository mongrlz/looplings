import { useEffect, useRef, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { createCRTMaterial } from '@/lib/crt-material';

export function flipPlaneUvY(_geometry: THREE.BufferGeometry) {
  // No-op: Y flip is now handled inside the CRT shader (single source of truth).
  // Kept as exported function to preserve call sites that pass it as `onUpdate`.
}

type HtmlInCanvasSurfaceProps = {
  meshRef: { current: THREE.Mesh | null };
  width: number;
  height: number;
  html?: string;
  children?: ReactNode;
  animated?: boolean;
  effects?: boolean;
  barrel?: number;
  brightness?: number;
  flicker?: number;
  phosphor?: number;
  reflection?: number;
  scanlines?: number;
  uploadFps?: number;
  warmupFrames?: number;
};

const HTML_SURFACE_ANIMATED_UPLOAD_FPS = 4;
const HTML_SURFACE_STATIC_UPLOAD_FPS = 4;
const HTML_SURFACE_ANIMATED_WARMUP_FRAMES = 6;
const HTML_SURFACE_STATIC_WARMUP_FRAMES = 16;

export function HtmlInCanvasSurface({
  meshRef,
  width,
  height,
  html,
  children,
  animated = false,
  effects = true,
  barrel,
  brightness,
  flicker,
  phosphor,
  reflection,
  scanlines,
  uploadFps,
  warmupFrames,
}: HtmlInCanvasSurfaceProps) {
  const { gl } = useThree();
  const elementRef = useRef<HTMLDivElement | null>(null);
  const rootRef = useRef<Root | null>(null);
  const materialRef = useRef<THREE.Material | null>(null);
  const textureRef = useRef<THREE.Texture | null>(null);
  const glTextureRef = useRef<WebGLTexture | null>(null);
  const dirtyRef = useRef(true);
  const frozenRef = useRef(false);
  const snapshotReadyRef = useRef(false);
  const warmupFramesRef = useRef(HTML_SURFACE_STATIC_WARMUP_FRAMES);
  const lastUploadRef = useRef(-Infinity);
  const hasChildren = children !== undefined;
  const resolvedUploadFps = Math.max(1, uploadFps ?? (animated ? HTML_SURFACE_ANIMATED_UPLOAD_FPS : HTML_SURFACE_STATIC_UPLOAD_FPS));
  const resolvedWarmupFrames = Math.max(1, warmupFrames ?? (animated ? HTML_SURFACE_ANIMATED_WARMUP_FRAMES : HTML_SURFACE_STATIC_WARMUP_FRAMES));

  useEffect(() => {
    const canvas = gl.domElement;
    const context = gl.getContext() as WebGL2RenderingContext;
    if (typeof context.texElementImage2D !== 'function') return undefined;

    dirtyRef.current = true;
    frozenRef.current = false;
    snapshotReadyRef.current = false;
    warmupFramesRef.current = resolvedWarmupFrames;
    // Stagger first upload by up to one frame interval so the 4 animated surfaces
    // don't all upload on the same frame (which causes a visible spike).
    const interval = 1 / resolvedUploadFps;
    lastUploadRef.current = -interval + Math.random() * interval;

    const element = document.createElement('div');
    element.style.width = `${width}px`;
    element.style.height = `${height}px`;
    element.style.position = 'absolute';
    element.style.left = '0';
    element.style.top = '0';
    element.style.transformOrigin = '0 0';
    element.style.opacity = '0';
    element.style.display = 'block';
    element.style.pointerEvents = 'auto';

    canvas.setAttribute('layoutsubtree', '');
    canvas.appendChild(element);
    elementRef.current = element;
    let root: Root | null = null;
    if (hasChildren) {
      root = createRoot(element);
      rootRef.current = root;
      root.render(<>{children}</>);
    } else {
      element.innerHTML = html ?? '';
    }
    const stopCanvasDrag = (event: Event) => event.stopPropagation();
    const pointerEvents = ['pointerdown', 'pointerup', 'pointermove', 'click', 'wheel'];
    pointerEvents.forEach((eventName) => {
      element.addEventListener(eventName, stopCanvasDrag);
    });

    const usesCapturedCanvas = typeof canvas.captureElementImage === 'function';
    const texture = new THREE.Texture();
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.generateMipmaps = false;
    texture.flipY = usesCapturedCanvas;
    texture.colorSpace = THREE.SRGBColorSpace;
    let glTexture: WebGLTexture | null = null;

    if (!usesCapturedCanvas) {
      glTexture = context.createTexture();
      if (!glTexture) {
        root?.unmount();
        element.remove();
        return undefined;
      }

      context.bindTexture(context.TEXTURE_2D, glTexture);
      context.texParameteri(context.TEXTURE_2D, context.TEXTURE_WRAP_S, context.CLAMP_TO_EDGE);
      context.texParameteri(context.TEXTURE_2D, context.TEXTURE_WRAP_T, context.CLAMP_TO_EDGE);
      context.texParameteri(context.TEXTURE_2D, context.TEXTURE_MIN_FILTER, context.LINEAR);
      context.texParameteri(context.TEXTURE_2D, context.TEXTURE_MAG_FILTER, context.LINEAR);
      const textureProps = gl.properties.get(texture) as {
        __webglTexture?: WebGLTexture;
        __webglInit?: boolean;
      };
      textureProps.__webglTexture = glTexture;
      textureProps.__webglInit = true;
    }

    const material = effects
      ? createCRTMaterial(texture, {
          barrel,
          brightness,
          flicker,
          phosphor,
          reflection,
          scanlines,
        })
      : new THREE.MeshBasicMaterial({ map: texture, toneMapped: false });
    if (material instanceof THREE.ShaderMaterial) {
      material.uniforms.u_resolution.value.set(width, height);
    }
    materialRef.current = material;
    textureRef.current = texture;
    glTextureRef.current = glTexture;

    let raf = 0;
    const attachMaterialWhenReady = () => {
      const mesh = meshRef.current;
      if (!mesh) {
        raf = window.requestAnimationFrame(attachMaterialWhenReady);
        return;
      }
      mesh.material = material;
      canvas.requestPaint?.();
    };
    attachMaterialWhenReady();

    const handlePaint = () => {
      if (frozenRef.current) return;
      dirtyRef.current = true;
      snapshotReadyRef.current = true;
    };

    canvas.addEventListener('paint', handlePaint);
    canvas.requestPaint?.();

    // Force a couple of re-dirty passes after React commits the embedded tree.
    // Some React roots inside the polyfilled canvas don't fire paint events on initial commit,
    // which can leave static surfaces frozen on a blank pre-commit snapshot.
    const repaintDelays = [120, 600];
    const repaintTimers = repaintDelays.map((ms) =>
      window.setTimeout(() => {
        dirtyRef.current = true;
        frozenRef.current = false;
        warmupFramesRef.current = Math.max(warmupFramesRef.current, 4);
        canvas.requestPaint?.();
      }, ms),
    );

    return () => {
      window.cancelAnimationFrame(raf);
      repaintTimers.forEach((id) => window.clearTimeout(id));
      pointerEvents.forEach((eventName) => {
        element.removeEventListener(eventName, stopCanvasDrag);
      });
      canvas.removeEventListener('paint', handlePaint);
      root?.unmount();
      element.remove();
      material.dispose();
      texture.dispose();
      if (glTexture) context.deleteTexture(glTexture);
      elementRef.current = null;
      materialRef.current = null;
      textureRef.current = null;
      glTextureRef.current = null;
      rootRef.current = null;
    };
  }, [barrel, brightness, effects, flicker, gl, hasChildren, height, meshRef, phosphor, reflection, resolvedWarmupFrames, scanlines, width]);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    dirtyRef.current = true;
    frozenRef.current = false;
    snapshotReadyRef.current = false;
    warmupFramesRef.current = resolvedWarmupFrames;
    lastUploadRef.current = -Infinity;

    if (hasChildren) {
      rootRef.current?.render(<>{children}</>);
    } else {
      element.innerHTML = html ?? '';
    }

    window.requestAnimationFrame(() => {
      dirtyRef.current = true;
      gl.domElement.requestPaint?.();
    });
  }, [children, gl, hasChildren, html, resolvedWarmupFrames]);

  const frustumRef = useRef(new THREE.Frustum());
  const projScreenMatrixRef = useRef(new THREE.Matrix4());
  const viewportMatrixRef = useRef(new THREE.Matrix4());
  const overlayMatrixRef = useRef(new THREE.Matrix4());
  const pixelToLocalMatrixRef = useRef(new THREE.Matrix4());
  const geometrySizeRef = useRef(new THREE.Vector3());
  const viewportSizeRef = useRef({ width: -1, height: -1 });
  const overlayTransformRef = useRef('');

  useFrame(({ clock, camera }) => {
    const element = elementRef.current;
    const material = materialRef.current;
    const texture = textureRef.current;
    const glTexture = glTextureRef.current;
    const mesh = meshRef.current;
    if (!element || !material || !texture || !mesh) return;

    const canvas = gl.domElement;
    const canvasWidth = canvas.clientWidth;
    const canvasHeight = canvas.clientHeight;
    if (
      canvasWidth !== viewportSizeRef.current.width ||
      canvasHeight !== viewportSizeRef.current.height
    ) {
      viewportMatrixRef.current.set(
        canvasWidth / 2,
        0,
        0,
        canvasWidth / 2,
        0,
        -canvasHeight / 2,
        0,
        canvasHeight / 2,
        0,
        0,
        1,
        0,
        0,
        0,
        0,
        1,
      );
      viewportSizeRef.current = { width: canvasWidth, height: canvasHeight };
    }

    if (!mesh.geometry.boundingBox) mesh.geometry.computeBoundingBox();
    const bounds = mesh.geometry.boundingBox;
    if (bounds) {
      bounds.getSize(geometrySizeRef.current);
      pixelToLocalMatrixRef.current.set(
        geometrySizeRef.current.x / width,
        0,
        0,
        -geometrySizeRef.current.x / 2,
        0,
        -geometrySizeRef.current.y / height,
        0,
        geometrySizeRef.current.y / 2,
        0,
        0,
        1,
        bounds.max.z,
        0,
        0,
        0,
        1,
      );
      overlayMatrixRef.current
        .multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse)
        .multiply(mesh.matrixWorld)
        .multiply(pixelToLocalMatrixRef.current)
        .premultiply(viewportMatrixRef.current);
      const overlayTransform = `matrix3d(${overlayMatrixRef.current.elements.join(',')})`;
      if (overlayTransform !== overlayTransformRef.current) {
        element.style.transform = overlayTransform;
        overlayTransformRef.current = overlayTransform;
      }
    }

    const elapsed = clock.elapsedTime;
    if (material instanceof THREE.ShaderMaterial) {
      material.uniforms.u_time.value = elapsed;
    }
    if (!animated && frozenRef.current) return;
    const inWarmup = warmupFramesRef.current > 0;
    if (!animated && !dirtyRef.current && !inWarmup) return;
    if (elapsed - lastUploadRef.current < 1 / resolvedUploadFps) return;

    if (mesh && !inWarmup) {
      projScreenMatrixRef.current.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
      frustumRef.current.setFromProjectionMatrix(projScreenMatrixRef.current);
      if (!mesh.geometry.boundingSphere) mesh.geometry.computeBoundingSphere();
      const sphere = mesh.geometry.boundingSphere;
      if (sphere) {
        const worldSphere = sphere.clone();
        worldSphere.applyMatrix4(mesh.matrixWorld);
        if (!frustumRef.current.intersectsSphere(worldSphere)) {
          dirtyRef.current = true;
          return;
        }
      }
    }

    if (snapshotReadyRef.current) {
      const context = gl.getContext() as WebGL2RenderingContext;
      try {
        if (typeof canvas.captureElementImage === 'function') {
          const captured = canvas.captureElementImage(element);
          texture.image = captured;
          texture.needsUpdate = true;
        } else if (glTexture) {
          context.pixelStorei(context.UNPACK_FLIP_Y_WEBGL, false);
          context.pixelStorei(context.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
          context.bindTexture(context.TEXTURE_2D, glTexture);
          context.texElementImage2D(
            context.TEXTURE_2D,
            0,
            context.RGBA,
            context.RGBA,
            context.UNSIGNED_BYTE,
            element,
          );
          gl.state.reset();
        }
        dirtyRef.current = false;
        snapshotReadyRef.current = false;
        warmupFramesRef.current = Math.max(0, warmupFramesRef.current - 1);
        if (!animated && warmupFramesRef.current <= 0) frozenRef.current = true;
      } catch {
        dirtyRef.current = true;
      }
    }
    canvas.requestPaint?.();
    lastUploadRef.current = elapsed;
  });

  return null;
}
