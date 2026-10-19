/**
 * Sizes the canvas backing store for the display's pixel density so drawing stays
 * sharp on high-DPI screens, and returns a context that draws in logical pixels.
 */
export function prepareCanvas(
  canvas: HTMLCanvasElement,
  width: number,
  height: number,
): CanvasRenderingContext2D {
  const ratio = window.devicePixelRatio || 1;
  canvas.width = Math.round(width * ratio);
  canvas.height = Math.round(height * ratio);
  // Show at logical size, shrinking (keeping aspect ratio) if the panel is narrow.
  canvas.style.width = `${width}px`;
  canvas.style.maxWidth = '100%';
  canvas.style.height = 'auto';

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Canvas 2D is not available');
  }
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  return ctx;
}
