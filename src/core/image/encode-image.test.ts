import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  chooseOutputMime,
  shouldResize,
  arrayBufferToBase64,
  encodeImageDataUri,
} from './encode-image';

describe('encode-image', () => {
  it('auto: png when alpha, jpeg otherwise', () => {
    expect(chooseOutputMime('auto', true, true)).toBe('image/png');
    expect(chooseOutputMime('auto', false, true)).toBe('image/jpeg');
  });
  it('explicit format wins; webp falls back to jpeg when unsupported', () => {
    expect(chooseOutputMime('jpeg', true, true)).toBe('image/jpeg');
    expect(chooseOutputMime('webp', false, false)).toBe('image/jpeg');
    expect(chooseOutputMime('webp', false, true)).toBe('image/webp');
  });
  it('does not resize svg/gif', () => {
    expect(shouldResize('image/svg+xml')).toBe(false);
    expect(shouldResize('image/gif')).toBe(false);
    expect(shouldResize('image/png')).toBe(true);
  });
  it('base64-encodes an array buffer', () => {
    const buf = new Uint8Array([0x41, 0x42, 0x43]).buffer; // "ABC"
    expect(arrayBufferToBase64(buf)).toBe('QUJD');
  });
});

describe('encodeImageDataUri', () => {
  const originalActiveDocument = (globalThis as Record<string, unknown>).activeDocument;
  const encoded = new Uint8Array([1, 2, 3, 4]);

  beforeEach(() => {
    (globalThis as Record<string, unknown>).activeDocument = document;

    // Obsidian augments Node with createEl(), which appends the new child to
    // `this`. Calling it on a Document throws HierarchyRequestError (a document
    // may only contain one element). Simulate that so this test fails if the
    // encoder ever goes back to using createEl() on the document.
    (Document.prototype as unknown as { createEl: (tag: string) => Element }).createEl = function (
      this: Document,
      tag: string,
    ) {
      const el = this.createElement(tag);
      this.appendChild(el);
      return el;
    };

    vi.stubGlobal(
      'createImageBitmap',
      vi.fn(async () => ({ width: 200, height: 100 })),
    );
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
      drawImage: vi.fn(),
      getImageData: () => ({ data: new Uint8ClampedArray(200 * 100 * 4).fill(255) }),
    } as unknown as CanvasRenderingContext2D);
    vi.spyOn(HTMLCanvasElement.prototype, 'toDataURL').mockReturnValue('data:image/webp;base64,AAAA');
    vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation((callback: BlobCallback) => {
      // jsdom's Blob lacks arrayBuffer(), which the encoder relies on.
      callback({
        type: 'image/jpeg',
        arrayBuffer: async () => encoded.buffer,
      } as unknown as Blob);
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    delete (Document.prototype as unknown as { createEl?: unknown }).createEl;
    if (originalActiveDocument === undefined) {
      delete (globalThis as Record<string, unknown>).activeDocument;
    } else {
      (globalThis as Record<string, unknown>).activeDocument = originalActiveDocument;
    }
  });

  it('re-encodes on a detached canvas instead of embedding the raw bytes', async () => {
    const raw = new Uint8Array([0xaa, 0xbb, 0xcc, 0xdd]).buffer;

    const result = await encodeImageDataUri(raw, 'image/png', {
      maxWidth: 100,
      quality: 0.8,
      format: 'auto',
    });

    expect(result.mime).toBe('image/jpeg');
    expect(result.dataUri).toBe(`data:image/jpeg;base64,${arrayBufferToBase64(encoded.buffer)}`);
    expect(result.dataUri).not.toContain(arrayBufferToBase64(raw));
  });
});
