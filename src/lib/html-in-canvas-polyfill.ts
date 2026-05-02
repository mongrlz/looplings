import { installHtmlInCanvasPolyfill } from 'three-html-render/polyfill';

const TAG = '[looplings:html-in-canvas]';

/**
 * Install the HTML-in-Canvas polyfill.
 *
 * Auto-detects whether the browser already supports the native API
 * (Chrome 148+ / Chrome Canary). When native is available, the polyfill
 * defers to the fast path. When it isn't, the polyfill emulates
 * texElementImage2D / requestPaint / paint events so the same code works
 * in any modern browser.
 *
 * Call exactly once at app boot, before any 3D scene mounts.
 */
export function setupHtmlInCanvas(): void {
  try {
    installHtmlInCanvasPolyfill();
    console.log(TAG, 'polyfill installed');
  } catch (err) {
    console.warn(TAG, 'polyfill install failed', err);
  }
}
