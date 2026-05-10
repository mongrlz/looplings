import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { createCRTMaterial } from '@/lib/crt-material';

export function flipPlaneUvY(geometry: THREE.BufferGeometry) {
  const uv = geometry.getAttribute('uv');
  if (!(uv instanceof THREE.BufferAttribute)) return;
  for (let index = 0; index < uv.count; index += 1) {
    uv.setY(index, 1 - uv.getY(index));
  }
  uv.needsUpdate = true;
}

type HtmlInCanvasSurfaceProps = {
  meshRef: { current: THREE.Mesh | null };
  width: number;
  height: number;
  html: string;
};

export function HtmlInCanvasSurface({ meshRef, width, height, html }: HtmlInCanvasSurfaceProps) {
  const { gl } = useThree();
  const elementRef = useRef<HTMLDivElement | null>(null);
  const materialRef = useRef<THREE.ShaderMaterial | null>(null);
  const textureRef = useRef<THREE.Texture | null>(null);
  const glTextureRef = useRef<WebGLTexture | null>(null);
  const dirtyRef = useRef(true);
  const warmupFramesRef = useRef(90);
  const lastUploadRef = useRef(-Infinity);

  useEffect(() => {
    const canvas = gl.domElement;
    const context = gl.getContext() as WebGL2RenderingContext;
    if (typeof context.texElementImage2D !== 'function') return undefined;

    const element = document.createElement('div');
    element.style.width = `${width}px`;
    element.style.height = `${height}px`;
    element.style.position = 'absolute';
    element.style.left = '0';
    element.style.top = '0';
    element.style.transformOrigin = '0 0';
    element.style.opacity = '0';
    element.innerHTML = html;
    const syncPointerEvents = () => {
      if (element.style.pointerEvents !== 'none') {
        element.style.setProperty('pointer-events', 'none', 'important');
      }
    };
    syncPointerEvents();

    canvas.setAttribute('layoutsubtree', '');
    canvas.appendChild(element);
    elementRef.current = element;
    const pointerObserver = new MutationObserver(syncPointerEvents);
    pointerObserver.observe(element, { attributes: true, attributeFilter: ['style'] });
    window.requestAnimationFrame(syncPointerEvents);

    const glTexture = context.createTexture();
    if (!glTexture) {
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

    const material = createCRTMaterial(texture);
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
      dirtyRef.current = true;
    };

    canvas.addEventListener('paint', handlePaint);
    canvas.requestPaint?.();

    return () => {
      window.cancelAnimationFrame(raf);
      pointerObserver.disconnect();
      canvas.removeEventListener('paint', handlePaint);
      element.remove();
      material.dispose();
      texture.dispose();
      context.deleteTexture(glTexture);
      elementRef.current = null;
      materialRef.current = null;
      textureRef.current = null;
      glTextureRef.current = null;
    };
  }, [gl, height, html, meshRef, width]);

  useFrame(({ clock }) => {
    const element = elementRef.current;
    const material = materialRef.current;
    const glTexture = glTextureRef.current;
    if (!element || !material || !glTexture) return;

    const elapsed = clock.elapsedTime;
    material.uniforms.u_time.value = elapsed;

    if (!dirtyRef.current && warmupFramesRef.current <= 0) return;
    if (elapsed - lastUploadRef.current < 1 / 24) return;

    const context = gl.getContext() as WebGL2RenderingContext;
    try {
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
      lastUploadRef.current = elapsed;
    } catch {
      dirtyRef.current = true;
    }
  });

  return null;
}
