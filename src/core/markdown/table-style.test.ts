import { describe, it, expect } from 'vitest';
import { applyTableStyles, DEFAULT_CELL_STYLE } from './table-style';

const md =
  '<table><thead><tr><th style="text-align:center">A</th></tr></thead>' +
  '<tbody><tr><td style="text-align:left">x</td></tr></tbody></table>';

describe('applyTableStyles', () => {
  it('adds table and cell styles', () => {
    const out = applyTableStyles(md);
    expect(out).toContain('border-collapse:collapse');
    expect(out).toContain('border:1px solid #d0d7de');
  });
  it('merges with existing text-align instead of dropping it', () => {
    expect(applyTableStyles(md)).toContain('text-align:center');
  });
  it('does not duplicate a declaration key already present', () => {
    const out = applyTableStyles('<table><tr><td style="padding:1px">y</td></tr></table>');
    expect(out.match(/padding:/g)?.length).toBe(1);
  });
  it('styles raw HTML tables too', () => {
    expect(applyTableStyles('<table><tr><td>z</td></tr></table>')).toContain(
      DEFAULT_CELL_STYLE.split(';')[0],
    );
  });
  it('preserves special cell characters', () => {
    const out = applyTableStyles('<table><tr><td>a &lt; b &amp; c 😀</td></tr></table>');
    expect(out).toContain('a &lt; b &amp; c 😀');
  });
  it('returns html unchanged when there is no table', () => {
    expect(applyTableStyles('<p>hi</p>')).toBe('<p>hi</p>');
  });
});
