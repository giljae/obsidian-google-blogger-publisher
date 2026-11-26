import { applyTableStyles } from './table-style';
import type { TableStyleOptions } from './table-style';
import { embedLocalImages } from './embed-local-images';
import type { EmbedLocalImagesDeps } from './embed-local-images';
import { applySvgTextColor } from './svg-color';

export interface PostProcessOptions {
  table?: TableStyleOptions;
  images?: EmbedLocalImagesDeps;
  /** Override the color that SVG `currentColor` resolves to (empty = off). */
  svgTextColor?: string;
}

export interface PostProcessResult {
  html: string;
  embeddedImages: number;
  failedImages: number;
}

/**
 * Run the single post-processing pass applied to rendered markdown right
 * before it is sent to Blogger: embed local images as data URIs, then bake
 * inline styles onto every table.
 */
export async function postProcessHtml(
  html: string,
  options: PostProcessOptions = {},
): Promise<PostProcessResult> {
  let current = html;
  let embeddedImages = 0;
  let failedImages = 0;

  if (options.images) {
    const imageResult = await embedLocalImages(html, options.images);
    current = imageResult.html;
    embeddedImages = imageResult.embedded;
    failedImages = imageResult.failed;
  }

  if (options.svgTextColor) {
    current = applySvgTextColor(current, options.svgTextColor);
  }

  current = applyTableStyles(current, options.table);
  return { html: current, embeddedImages, failedImages };
}
