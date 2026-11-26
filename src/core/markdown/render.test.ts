import { describe, it, expect } from 'vitest';
import { createMarkdownParser, setupMathJax } from './render';
import { MathJaxOutputType } from '../types';

describe('render pipeline', () => {
  it('renders inline math to inline SVG', () => {
    const md = createMarkdownParser();
    setupMathJax(md, MathJaxOutputType.SVG);
    expect(md.render('value $a^2$ end')).toContain('<svg');
  });

  it('keeps TeX source when outputType is TeX', () => {
    const md = createMarkdownParser();
    setupMathJax(md, MathJaxOutputType.TeX);
    expect(md.render('$a^2$')).toContain('$a^2$');
  });

  it('keeps the rendered math through a DOMParser round-trip', () => {
    const md = createMarkdownParser();
    setupMathJax(md, MathJaxOutputType.SVG);
    const html = md.render('$x+1$');
    const body = new DOMParser().parseFromString(html, 'text/html').body.innerHTML;
    expect(body).toContain('<svg');
  });

  it('renders images and footnotes', () => {
    const md = createMarkdownParser();
    expect(md.render('![x|200](a.png)')).toContain('width="200"');
    expect(md.render('text[^1]\n\n[^1]: note')).toContain('footnote');
  });

  it('does not duplicate math rules when set up twice', () => {
    const md = createMarkdownParser();
    setupMathJax(md, MathJaxOutputType.SVG);
    setupMathJax(md, MathJaxOutputType.SVG);
    const ruler = md.inline.ruler as unknown as { __rules__: { name: string }[] };
    expect(ruler.__rules__.filter((rule) => rule.name === 'math_inline')).toHaveLength(1);
  });
});
