import { installHtmlInCanvasPolyfill } from 'three-html-render/polyfill';

const TAG = '[looplings:html-in-canvas]';

/**
 * Install the HTML-in-Canvas compatibility renderer.
 *
 * Chrome can expose the draft 2D paint API before the WebGL upload path is
 * complete. That partial API passes three-html-render's native feature check,
 * skips its fallback, and leaves our WebGL screen without a texture source.
 * Force the compatibility path until the native API is complete and stable.
 *
 * Call exactly once at app boot, before any 3D scene mounts.
 */
export function setupHtmlInCanvas(): void {
  try {
    installHtmlInCanvasPolyfill({ force: true });
    console.log(TAG, 'compatibility renderer installed');
  } catch (err) {
    console.warn(TAG, 'compatibility renderer install failed', err);
  }
}
