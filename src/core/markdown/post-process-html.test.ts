import { describe, it, expect } from 'vitest';
import { postProcessHtml } from './post-process-html';

describe('postProcessHtml', () => {
  it('embeds images and styles tables in one pass', async () => {
    const html = '<table><tr><td><img src="a.png"></td></tr></table>';
    const r = await postProcessHtml(html, {
      images: { resolveImage: async () => 'data:image/png;base64,AAA' },
    });
    expect(r.html).toContain('data:image/png;base64,AAA');
    expect(r.html).toContain('border:1px solid #d0d7de');
    expect(r.embeddedImages).toBe(1);
  });
  it('works with no images dep (tables only)', async () => {
    const r = await postProcessHtml('<table><tr><td>x</td></tr></table>', {});
    expect(r.html).toContain('border-collapse:collapse');
    expect(r.embeddedImages).toBe(0);
  });
});
