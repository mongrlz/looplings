import { installHtmlInCanvasPolyfill } from 'three-html-render/polyfill';

const TAG = '[looplings:html-in-canvas]';

function hasCompleteNativeRenderer(): boolean {
  const runtime = window as Window & { __HTML_IN_CANVAS_POLYFILL__?: boolean };
  if (runtime.__HTML_IN_CANVAS_POLYFILL__) return false;

  return (
    typeof CanvasRenderingContext2D !== 'undefined' &&
    typeof HTMLCanvasElement !== 'undefined' &&
    typeof WebGL2RenderingContext !== 'undefined' &&
    'drawElementImage' in CanvasRenderingContext2D.prototype &&
    'requestPaint' in HTMLCanvasElement.prototype &&
    'onpaint' in HTMLCanvasElement.prototype &&
    'texElementImage2D' in WebGL2RenderingContext.prototype
  );
}

/**
 * Install the HTML-in-Canvas compatibility renderer.
 *
 * Chrome can expose the draft 2D paint API before the WebGL upload path is
 * complete. That partial API passes three-html-render's native feature check,
 * skips its fallback, and leaves our WebGL screen without a texture source. Use
 * the native renderer only when the WebGL texture upload API is present too.
 *
 * Call exactly once at app boot, before any 3D scene mounts.
 */
export function setupHtmlInCanvas(): void {
  try {
    const nativeRenderer = hasCompleteNativeRenderer();
    installHtmlInCanvasPolyfill({ force: !nativeRenderer });
    console.log(TAG, nativeRenderer ? 'native renderer ready' : 'compatibility renderer installed');
  } catch (err) {
    console.warn(TAG, 'compatibility renderer install failed', err);
  }
}
