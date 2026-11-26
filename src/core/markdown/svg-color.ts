export const DEFAULT_SVG_TEXT_COLOR = '#1f2937';

function decodeBase64(base64: string): string {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new TextDecoder().decode(bytes);
}

/**
 * Re-encode an SVG data URI with an internal `svg{color:<color> !important}`
 * rule so every `currentColor` element picks up `color`. This fixes diagrams
 * generated for a dark theme (light `currentColor`) that are invisible on a
 * light blog background. Non-SVG data URIs and an empty color are returned
 * unchanged.
 */
export function recolorSvgDataUri(src: string, color: string): string {
  if (!color || !/^data:image\/svg\+xml/i.test(src)) {
    return src;
  }
  const comma = src.indexOf(',');
  if (comma < 0) {
    return src;
  }
  const meta = src.slice(0, comma);
  const payload = src.slice(comma + 1);

  let svg: string;
  try {
    svg = /;base64/i.test(meta) ? decodeBase64(payload) : decodeURIComponent(payload);
  } catch {
    return src;
  }

  const rootTag = svg.match(/<svg\b[^>]*>/i);
  if (!rootTag) {
    return src;
  }
  const injected = `<style>svg{color:${color} !important}</style>`;
  const modified = svg.replace(rootTag[0], rootTag[0] + injected);
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(modified)}`;
}

/**
 * Apply `recolorSvgDataUri` to every `<img>` whose src is an SVG data URI.
 */
export function applySvgTextColor(html: string, color: string): string {
  if (!color || !html.includes('data:image/svg+xml')) {
    return html;
  }
  const doc = new DOMParser().parseFromString(html, 'text/html');
  doc.body.querySelectorAll('img').forEach((img) => {
    const src = img.getAttribute('src');
    if (src && /^data:image\/svg\+xml/i.test(src)) {
      const recolored = recolorSvgDataUri(src, color);
      if (recolored !== src) {
        img.setAttribute('src', recolored);
      }
    }
  });
  return doc.body.innerHTML;
}
