export type ImageOutputFormat = 'auto' | 'jpeg' | 'png' | 'webp';

export interface EncodeImageOptions {
  maxWidth: number;
  quality: number;
  format: ImageOutputFormat;
}

export interface EncodedImage {
  dataUri: string;
  mime: string;
}

/**
 * Pick the output MIME type. `auto` keeps transparency (PNG) and otherwise
 * re-encodes to JPEG for size; explicit formats win, and WebP falls back to
 * JPEG where the canvas cannot encode it.
 */
export function chooseOutputMime(
  format: ImageOutputFormat,
  hasAlpha: boolean,
  canEncodeWebp: boolean,
): string {
  switch (format) {
    case 'jpeg':
      return 'image/jpeg';
    case 'png':
      return 'image/png';
    case 'webp':
      return canEncodeWebp ? 'image/webp' : 'image/jpeg';
    case 'auto':
    default:
      return hasAlpha ? 'image/png' : 'image/jpeg';
  }
}

/**
 * SVG (vector) and GIF (animation) must be embedded as-is; every other
 * raster type is safe to downscale and re-encode.
 */
export function shouldResize(sourceMime: string): boolean {
  return sourceMime !== 'image/svg+xml' && sourceMime !== 'image/gif';
}

const BASE64_CHUNK = 0x8000;

export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i += BASE64_CHUNK) {
    binary += String.fromCharCode(...bytes.subarray(i, i + BASE64_CHUNK));
  }
  return btoa(binary);
}

function rawDataUri(bytes: ArrayBuffer, mime: string): EncodedImage {
  return { dataUri: `data:${mime};base64,${arrayBufferToBase64(bytes)}`, mime };
}

function canvasToBlob(canvas: HTMLCanvasElement, mime: string, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, mime, quality));
}

function canvasCanEncodeWebp(canvas: HTMLCanvasElement): boolean {
  try {
    return canvas.toDataURL('image/webp').startsWith('data:image/webp');
  } catch {
    return false;
  }
}

function canvasHasAlpha(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
): boolean {
  try {
    const data = ctx.getImageData(0, 0, width, height).data;
    for (let i = 3; i < data.length; i += 4) {
      if (data[i] < 255) {
        return true;
      }
    }
  } catch {
    // getImageData can throw on tainted canvases; assume no alpha.
  }
  return false;
}

/**
 * Turn raw image bytes into a self-contained data URI: downscale to
 * `maxWidth` and re-encode for size, falling back to the original bytes
 * whenever the canvas pipeline is unavailable or fails.
 */
export async function encodeImageDataUri(
  bytes: ArrayBuffer,
  sourceMime: string,
  options: EncodeImageOptions,
): Promise<EncodedImage> {
  if (!shouldResize(sourceMime)) {
    return rawDataUri(bytes, sourceMime);
  }
  try {
    const bitmap = await createImageBitmap(new Blob([bytes], { type: sourceMime }));
    const scale =
      options.maxWidth > 0 && bitmap.width > options.maxWidth
        ? options.maxWidth / bitmap.width
        : 1;
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('no 2d context');
    }
    ctx.drawImage(bitmap, 0, 0, width, height);

    const mime = chooseOutputMime(options.format, canvasHasAlpha(ctx, width, height), canvasCanEncodeWebp(canvas));
    const blob = await canvasToBlob(canvas, mime, options.quality);
    if (!blob) {
      throw new Error('canvas.toBlob returned null');
    }
    return rawDataUri(await blob.arrayBuffer(), blob.type || mime);
  } catch {
    return rawDataUri(bytes, sourceMime);
  }
}
