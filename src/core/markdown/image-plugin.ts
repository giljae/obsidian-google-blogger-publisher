import MarkdownIt from 'markdown-it';
import Token from 'markdown-it/lib/token';

export interface MarkdownItImageParams {
  src: string;
  width?: string;
  height?: string;
}

const WIKILINK_IMAGE = /^!\[\[([^|\]\n]+)(?:\|([^\]\n]+))?\]\]/;

function parseSize(size: string | undefined): { width?: string; height?: string } {
  if (!size || !size.trim()) {
    return {};
  }
  const sep = size.indexOf('x');
  if (sep > 0) {
    return { width: size.slice(0, sep).trim(), height: size.slice(sep + 1).trim() };
  }
  return { width: size.trim() };
}

function renderImg(src: string, width: string | undefined, height: string | undefined, alt: string): string {
  const attrs = [`src="${src}"`];
  if (width) {
    attrs.push(`width="${width}"`);
  }
  if (height) {
    attrs.push(`height="${height}"`);
  }
  attrs.push(`alt="${alt}"`);
  return `<img ${attrs.join(' ')}>`;
}

function sizeOf(token: Token): { width?: string; height?: string } {
  const width = token.attrGet('width') ?? undefined;
  const height = token.attrGet('height') ?? undefined;
  return { width, height };
}

/**
 * Adds image support on top of markdown-it's default image rule:
 * - `![alt|WxH](src)` size suffix (plain Markdown images)
 * - `![[src|WxH]]` Obsidian wikilink images
 */
export function imagePlugin(md: MarkdownIt, onImage?: (params: MarkdownItImageParams) => void): void {
  const defaultImage = md.renderer.rules.image;
  md.renderer.rules.image = (tokens, idx, options, env, self) => {
    const token = tokens[idx];
    const src = token.attrGet('src') ?? '';
    const [alt, size] = token.content.split('|');
    const { width, height } = parseSize(size);
    onImage?.({ src, width, height });
    if (width) {
      return renderImg(src, width, height, alt);
    }
    // No size given: keep default rendering.
    return defaultImage ? defaultImage(tokens, idx, options, env, self) : renderImg(src, undefined, undefined, alt);
  };

  md.inline.ruler.after('image', 'ob_img', (state, silent) => {
    const match = state.src.slice(state.pos).match(WIKILINK_IMAGE);
    if (!match) {
      return false;
    }
    if (silent) {
      return true;
    }
    const src = match[1];
    const { width, height } = parseSize(match[2]);
    const token = state.push('ob_img', 'img', 0);
    token.attrs = [['src', src]];
    if (width) {
      token.attrSet('width', width);
    }
    if (height) {
      token.attrSet('height', height);
    }
    onImage?.({ src, width, height });
    state.pos += match[0].length;
    return true;
  });

  md.renderer.rules.ob_img = (tokens, idx) => {
    const token = tokens[idx];
    const src = token.attrGet('src') ?? '';
    const { width, height } = sizeOf(token);
    return renderImg(src, width, height, '');
  };
}
