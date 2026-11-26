import { describe, it, expect } from 'vitest';
import { recolorSvgDataUri, applySvgTextColor, DEFAULT_SVG_TEXT_COLOR } from './svg-color';

const COLOR = '#1f2937';
const utf8Svg = (svg: string) => 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
const decodePayload = (uri: string) => decodeURIComponent(uri.slice(uri.indexOf(',') + 1));

describe('recolorSvgDataUri', () => {
  it('injects a color override that currentColor resolves to', () => {
    const svg =
      '<svg style="color:rgb(237,237,237)" fill="currentColor"><text fill="currentColor">A</text></svg>';
    const out = recolorSvgDataUri(utf8Svg(svg), COLOR);
    const decoded = decodePayload(out);
    expect(decoded).toContain('svg{color:#1f2937 !important}');
    expect(decoded).toContain('currentColor');
  });

  it('handles a base64-encoded svg', () => {
    const svg = '<svg style="color:#ffffff"></svg>';
    const b64 = Buffer.from(svg, 'utf-8').toString('base64');
    const out = recolorSvgDataUri('data:image/svg+xml;base64,' + b64, COLOR);
    expect(decodePayload(out)).toContain('color:#1f2937 !important');
  });

  it('leaves non-svg images unchanged', () => {
    expect(recolorSvgDataUri('data:image/png;base64,AAAA', COLOR)).toBe(
      'data:image/png;base64,AAAA',
    );
  });

  it('leaves the src unchanged when color is empty', () => {
    const uri = utf8Svg('<svg></svg>');
    expect(recolorSvgDataUri(uri, '')).toBe(uri);
  });

  it('exposes the default color', () => {
    expect(DEFAULT_SVG_TEXT_COLOR).toMatch(/^#[0-9a-f]{6}$/i);
  });
});

describe('applySvgTextColor', () => {
  it('recolors only svg data-uri images', () => {
    const html =
      `<p><img src="${utf8Svg('<svg style="color:#fff"></svg>')}" alt=""></p>` +
      `<p><img src="data:image/png;base64,AAAA" alt=""></p>`;
    const out = applySvgTextColor(html, COLOR);
    const m = out.match(/src="(data:image\/svg\+xml;charset=utf-8,[^"]+)"/);
    expect(m).not.toBeNull();
    expect(decodePayload(m![1])).toContain('color:#1f2937 !important');
    expect(out).toContain('data:image/png;base64,AAAA');
  });

  it('returns html unchanged when there is no svg', () => {
    expect(applySvgTextColor('<p>hi</p>', COLOR)).toBe('<p>hi</p>');
  });
});
