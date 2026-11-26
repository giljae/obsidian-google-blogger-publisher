import MarkdownIt from 'markdown-it';
import footnote from 'markdown-it-footnote';
import { imagePlugin } from './image-plugin';
import { mathJaxPlugin } from './mathjax-plugin';
import { MathJaxOutputType } from '../types';

let globalParser: MarkdownIt | undefined;
let globalEnableHtml = false;

/** Create a markdown-it parser with image syntax and footnotes. */
export function createMarkdownParser(enableHtml = false): MarkdownIt {
  const md = new MarkdownIt({ linkify: true, breaks: true, html: enableHtml });
  md.use(imagePlugin);
  md.use(footnote);

  // markdown-it only allows data:image/(gif|png|jpeg|webp); allow every
  // data:image/* URI so pasted SVG diagrams render as images.
  const defaultValidateLink = md.validateLink.bind(md);
  md.validateLink = (url: string): boolean =>
    /^data:image\//i.test(url.trim()) ? true : defaultValidateLink(url);

  return md;
}

/** Enable MathJax rendering on a parser (re-callable when settings change). */
export function setupMathJax(md: MarkdownIt, outputType: MathJaxOutputType): void {
  md.use(mathJaxPlugin, { outputType });
}

/** The process-wide parser used by the publish pipeline. */
export function getGlobalMarkdownParser(): MarkdownIt {
  if (!globalParser) {
    globalParser = createMarkdownParser(globalEnableHtml);
    setupMathJax(globalParser, MathJaxOutputType.SVG);
  }
  return globalParser;
}

/** Toggle raw HTML rendering on the global parser. */
export function setGlobalMarkdownHtml(enableHtml: boolean): void {
  globalEnableHtml = enableHtml;
  globalParser?.set({ html: enableHtml });
}
