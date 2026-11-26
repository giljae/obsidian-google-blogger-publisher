import { describe, it, expect } from 'vitest';
import { chooseOutputMime, shouldResize, arrayBufferToBase64 } from './encode-image';

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
