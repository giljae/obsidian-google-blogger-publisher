import { describe, it, expect, vi } from 'vitest';
import { embedLocalImages } from './embed-local-images';

const img = (s: string) => `<p><img src="${s}" alt="a"></p>`;

describe('embedLocalImages', () => {
  it('replaces a local src with the resolved data uri', async () => {
    const r = await embedLocalImages(img('a.png'), {
      resolveImage: async () => 'data:image/png;base64,AAA',
    });
    expect(r.html).toContain('src="data:image/png;base64,AAA"');
    expect(r.embedded).toBe(1);
  });
  it('leaves absolute and data uris untouched', async () => {
    const resolveImage = vi.fn();
    const r = await embedLocalImages(img('https://x/y.png') + img('data:image/png;base64,ZZ'), {
      resolveImage,
    });
    expect(resolveImage).not.toHaveBeenCalled();
    expect(r.embedded).toBe(0);
  });
  it('keeps original src and counts failure when unresolved', async () => {
    const r = await embedLocalImages(img('missing.png'), { resolveImage: async () => null });
    expect(r.html).toContain('src="missing.png"');
    expect(r.failed).toBe(1);
  });
  it('resolves each unique src only once', async () => {
    const resolveImage = vi.fn(async () => 'data:image/png;base64,AAA');
    await embedLocalImages(img('a.png') + img('a.png'), { resolveImage });
    expect(resolveImage).toHaveBeenCalledTimes(1);
  });
  it('calls onError and keeps going when resolveImage throws', async () => {
    const onError = vi.fn();
    const r = await embedLocalImages(img('boom.png'), {
      resolveImage: async () => {
        throw new Error('x');
      },
      onError,
    });
    expect(r.failed).toBe(1);
    expect(onError).toHaveBeenCalledOnce();
  });
  it('preserves width/height attributes', async () => {
    const r = await embedLocalImages('<img src="a.png" width="300">', {
      resolveImage: async () => 'data:image/png;base64,AAA',
    });
    expect(r.html).toContain('width="300"');
  });
});
