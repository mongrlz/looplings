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
  barrel?: number;
  brightness?: number;
  flicker?: number;
  phosphor?: number;
  reflection?: number;
  scanlines?: number;
  uploadFps?: number;
  warmupFrames?: number;
  interactive?: boolean;
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
  barrel,
  brightness,
  flicker,
  phosphor,
  reflection,
  scanlines,
  uploadFps,
  warmupFrames,
  interactive = false,
}: HtmlInCanvasSurfaceProps) {
  const { gl } = useThree();
  const elementRef = useRef<HTMLDivElement | null>(null);
  const rootRef = useRef<Root | null>(null);
  const materialRef = useRef<THREE.ShaderMaterial | null>(null);
  const textureRef = useRef<THREE.Texture | null>(null);
  const glTextureRef = useRef<WebGLTexture | null>(null);
  const dirtyRef = useRef(true);
  const frozenRef = useRef(false);
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
    warmupFramesRef.current = resolvedWarmupFrames;
    // Stagger first upload by up to one frame interval so the 4 animated surfaces
    // don't all upload on the same frame (which causes a visible spike).
    const interval = 1 / resolvedUploadFps;
    lastUploadRef.current = -interval + Math.random() * interval;

    const element = document.createElement('div');
    element.setAttribute('data-html-in-canvas-wrapper', '');
    element.style.width = `${width}px`;
    element.style.height = `${height}px`;
    element.style.position = 'absolute';
    element.style.left = '0';
    element.style.top = '0';
    element.style.transformOrigin = '0 0';
    element.style.opacity = '1';
    element.style.display = 'block';
    const syncPointerEvents = () => {
      if (interactive) {
        // Opt-in: allow taps inside the embedded HTML. Native html-in-canvas
        // forwards clicks through; polyfilled browsers won't get tap routing,
        // but the room still works via the top-overlay fallback dropdown.
        if (element.style.pointerEvents !== 'auto') {
          element.style.setProperty('pointer-events', 'auto', 'important');
        }
        return;
      }
      if (element.style.pointerEvents !== 'none') {
        element.style.setProperty('pointer-events', 'none', 'important');
      }
    };
    syncPointerEvents();

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
    const pointerObserver = new MutationObserver(syncPointerEvents);
    pointerObserver.observe(element, { attributes: true, attributeFilter: ['style'] });
    window.requestAnimationFrame(syncPointerEvents);

    const glTexture = context.createTexture();
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

    const texture = new THREE.Texture();
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.generateMipmaps = false;
    const textureProps = gl.properties.get(texture) as {
      __webglTexture?: WebGLTexture;
      __webglInit?: boolean;
    };
    textureProps.__webglTexture = glTexture;
    textureProps.__webglInit = true;

    const material = createCRTMaterial(texture, {
      barrel,
      brightness,
      flicker,
      phosphor,
      reflection,
      scanlines,
    });
    material.uniforms.u_resolution.value.set(width, height);
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
    };
    attachMaterialWhenReady();

    const handlePaint = () => {
      if (frozenRef.current) return;
      dirtyRef.current = true;
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
      pointerObserver.disconnect();
      canvas.removeEventListener('paint', handlePaint);
      root?.unmount();
      element.remove();
      material.dispose();
      texture.dispose();
      context.deleteTexture(glTexture);
      elementRef.current = null;
      materialRef.current = null;
      textureRef.current = null;
      glTextureRef.current = null;
      rootRef.current = null;
    };
  }, [barrel, brightness, flicker, gl, hasChildren, height, interactive, meshRef, phosphor, reflection, resolvedWarmupFrames, scanlines, width]);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    dirtyRef.current = true;
    frozenRef.current = false;
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
  const cornerRef = useRef([
    new THREE.Vector3(),
    new THREE.Vector3(),
    new THREE.Vector3(),
    new THREE.Vector3(),
  ]);

  useFrame(({ clock, camera }) => {
    const element = elementRef.current;
    const material = materialRef.current;
    const glTexture = glTextureRef.current;
    const mesh = meshRef.current;
    if (!element || !material || !glTexture) return;

    const elapsed = clock.elapsedTime;
    material.uniforms.u_time.value = elapsed;

    // Sawyer Hood's pattern: when the surface is interactive, project the
    // screen mesh's world-space corners through the camera each frame and
    // CSS-transform the embedded DOM wrapper to occupy that viewport region.
    // The wrapper then receives native clicks (no html-in-canvas event
    // forwarding needed), works in every browser, and texElementImage2D
    // still reads the wrapper's pre-transform layout so the texture is
    // unaffected by the transform.
    if (interactive && mesh && mesh.geometry) {
      const planeGeom = mesh.geometry as THREE.PlaneGeometry;
      const w = planeGeom.parameters?.width ?? 1;
      const h = planeGeom.parameters?.height ?? 1;
      const corners = cornerRef.current;
      corners[0].set(-w / 2, -h / 2, 0);
      corners[1].set(w / 2, -h / 2, 0);
      corners[2].set(-w / 2, h / 2, 0);
      corners[3].set(w / 2, h / 2, 0);
      mesh.updateMatrixWorld();
      const canvasRect = gl.domElement.getBoundingClientRect();
      let minX = Infinity;
      let minY = Infinity;
      let maxX = -Infinity;
      let maxY = -Infinity;
      let behindCamera = false;
      for (const corner of corners) {
        corner.applyMatrix4(mesh.matrixWorld);
        corner.project(camera);
        if (corner.z > 1) {
          behindCamera = true;
          break;
        }
        const sx = ((corner.x + 1) / 2) * canvasRect.width;
        const sy = ((1 - corner.y) / 2) * canvasRect.height;
        if (sx < minX) minX = sx;
        if (sy < minY) minY = sy;
        if (sx > maxX) maxX = sx;
        if (sy > maxY) maxY = sy;
      }
      if (!behindCamera && Number.isFinite(minX)) {
        const projectedW = Math.max(1, maxX - minX);
        const projectedH = Math.max(1, maxY - minY);
        const scaleX = projectedW / width;
        const scaleY = projectedH / height;
        const translateX = canvasRect.left + minX;
        const translateY = canvasRect.top + minY;
        const transform = `translate(${translateX}px, ${translateY}px) scale(${scaleX}, ${scaleY})`;
        if (element.style.transform !== transform) {
          element.style.transformOrigin = '0 0';
          element.style.transform = transform;
          element.style.position = 'fixed';
        }
      }
    } else if (element.style.transform) {
      element.style.transform = '';
      element.style.transformOrigin = '';
      element.style.position = 'absolute';
    }

    if (!animated && frozenRef.current) return;
    const inWarmup = warmupFramesRef.current > 0;
    if (!dirtyRef.current && !inWarmup) return;
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

    const context = gl.getContext() as WebGL2RenderingContext;
    try {
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
      dirtyRef.current = false;
      warmupFramesRef.current = Math.max(0, warmupFramesRef.current - 1);
      if (!animated && warmupFramesRef.current <= 0) frozenRef.current = true;
      lastUploadRef.current = elapsed;
    } catch {
      dirtyRef.current = true;
    }
  });

  return null;
}
