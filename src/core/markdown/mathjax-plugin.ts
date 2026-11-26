import MarkdownIt from 'markdown-it';
import StateInline from 'markdown-it/lib/rules_inline/state_inline';
import StateBlock from 'markdown-it/lib/rules_block/state_block';
import Token from 'markdown-it/lib/token';
import { TeX } from 'mathjax-full/js/input/tex';
import { AllPackages } from 'mathjax-full/js/input/tex/AllPackages';
import { SVG } from 'mathjax-full/js/output/svg';
import { liteAdaptor } from 'mathjax-full/js/adaptors/liteAdaptor';
import { RegisterHTMLHandler } from 'mathjax-full/js/handlers/html';
import { AssistiveMmlHandler } from 'mathjax-full/js/a11y/assistive-mml';
import { mathjax } from 'mathjax-full/js/mathjax';
import juice from 'juice';
import { MathJaxOutputType, SafeAny } from '../types';

export interface MathJaxPluginOptions {
  outputType: MathJaxOutputType;
}

/** Render a math expression to SVG (with inlined CSS) or to TeX source. */
function renderMath(content: string, display: boolean, options: MathJaxPluginOptions): string {
  if (options.outputType !== MathJaxOutputType.SVG) {
    return display ? `$$\n${content}\n$$` : `$${content}$`;
  }

  const inputJax = new TeX({ packages: AllPackages });
  const outputJax = new SVG({ fontCache: 'none' });
  const adaptor = liteAdaptor();
  const handler = RegisterHTMLHandler(adaptor);
  AssistiveMmlHandler(handler);

  const document = mathjax.document('', { InputJax: inputJax, OutputJax: outputJax });
  const node = document.convert(content, { display, em: 16, ex: 8, containerWidth: 600 });
  const html = adaptor.outerHTML(node);
  const css = adaptor.outerHTML(outputJax.styleSheet(document) as SafeAny);
  return juice(html + css);
}

/** Whether a `$` at `pos` can open/close an inline math span. */
function delimiterFlags(state: StateInline, pos: number): { canOpen: boolean; canClose: boolean } {
  const max = state.posMax;
  let canOpen = true;
  let canClose = true;

  const prev = pos > 0 ? state.src.charCodeAt(pos - 1) : -1;
  const next = pos + 1 <= max ? state.src.charCodeAt(pos + 1) : -1;

  if (prev === 0x20 || prev === 0x09 || (next >= 0x30 && next <= 0x39)) {
    canClose = false;
  }
  if (next === 0x20 || next === 0x09) {
    canOpen = false;
  }
  return { canOpen, canClose };
}

/** Find the matching closing `$`, honouring backslash escapes. */
function findClosingDollar(src: string, from: number): number {
  let match = from;
  while ((match = src.indexOf('$', match)) !== -1) {
    let pos = match - 1;
    while (src[pos] === '\\') {
      pos -= 1;
    }
    if ((match - pos) % 2 === 1) {
      return match;
    }
    match += 1;
  }
  return -1;
}

function mathInline(state: StateInline, silent: boolean): boolean {
  if (state.src[state.pos] !== '$') {
    return false;
  }

  const open = delimiterFlags(state, state.pos);
  if (!open.canOpen) {
    if (!silent) {
      state.pending += '$';
    }
    state.pos += 1;
    return true;
  }

  const start = state.pos + 1;
  const close = findClosingDollar(state.src, start);
  if (close === -1 || close === start) {
    if (!silent) {
      state.pending += close === start ? '$$' : '$';
    }
    state.pos = close === start ? start + 1 : start;
    return true;
  }

  if (!delimiterFlags(state, close).canClose) {
    if (!silent) {
      state.pending += '$';
    }
    state.pos = start;
    return true;
  }

  if (!silent) {
    const token = state.push('math_inline', 'math', 0);
    token.markup = '$';
    token.content = state.src.slice(start, close);
  }
  state.pos = close + 1;
  return true;
}

function mathBlock(state: StateBlock, start: number, end: number, silent: boolean): boolean {
  let pos = state.bMarks[start] + state.tShift[start];
  let max = state.eMarks[start];

  if (pos + 2 > max || state.src.slice(pos, pos + 2) !== '$$') {
    return false;
  }
  pos += 2;
  let firstLine = state.src.slice(pos, max);

  if (silent) {
    return true;
  }

  let found = false;
  let lastLine = '';
  if (firstLine.trim().slice(-2) === '$$') {
    firstLine = firstLine.trim().slice(0, -2);
    found = true;
  }

  let next = start;
  while (!found && ++next < end) {
    pos = state.bMarks[next] + state.tShift[next];
    max = state.eMarks[next];
    if (pos < max && state.tShift[next] < state.blkIndent) {
      break;
    }
    if (state.src.slice(pos, max).trim().slice(-2) === '$$') {
      const lastPos = state.src.slice(0, max).lastIndexOf('$$');
      lastLine = state.src.slice(pos, lastPos);
      found = true;
    }
  }

  state.line = next + 1;

  const token = state.push('math_block', 'math', 0);
  token.block = true;
  token.content =
    (firstLine.trim() ? firstLine + '\n' : '') +
    state.getLines(start + 1, next, state.tShift[start], true) +
    (lastLine.trim() ? lastLine : '');
  token.map = [start, state.line];
  token.markup = '$$';
  return true;
}

/** Parsers whose math rules have already been registered (register once). */
const configured = new WeakSet<MarkdownIt>();

/** Markdown-it plugin rendering `$..$` and `$$..$$` math. Safe to apply twice. */
export function mathJaxPlugin(md: MarkdownIt, options: MathJaxPluginOptions): void {
  if (!configured.has(md)) {
    md.inline.ruler.after('escape', 'math_inline', mathInline);
    md.block.ruler.after('blockquote', 'math_block', mathBlock, {
      alt: ['paragraph', 'reference', 'blockquote', 'list'],
    });
    configured.add(md);
  }
  md.renderer.rules.math_inline = (tokens: Token[], idx: number): string =>
    renderMath(tokens[idx].content, false, options);
  md.renderer.rules.math_block = (tokens: Token[], idx: number): string =>
    renderMath(tokens[idx].content, true, options);
}
