import { App, TFile, normalizePath } from 'obsidian';
import {
  EncodeImageOptions,
  ImageOutputFormat,
  encodeImageDataUri,
} from '../core/image/encode-image';

export interface ObsidianImageResolverOptions {
  app: App;
  sourcePath: string;
  maxWidth: number;
  quality: number;
  format: ImageOutputFormat;
}

const MIME_BY_EXTENSION: Record<string, string> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  gif: 'image/gif',
  webp: 'image/webp',
  svg: 'image/svg+xml',
};

/**
 * Resolve a local `src` (a vault path or wikilink target) to a base64 data URI,
 * or `null` when the file cannot be found or read.
 */
export function createObsidianImageResolver(
  options: ObsidianImageResolverOptions,
): (src: string) => Promise<string | null> {
  const encodeOptions: EncodeImageOptions = {
    maxWidth: options.maxWidth,
    quality: options.quality,
    format: options.format,
  };

  return async (src: string): Promise<string | null> => {
    try {
      let linkpath: string;
      try {
        linkpath = decodeURIComponent(src);
      } catch {
        linkpath = src;
      }

      const file =
        options.app.metadataCache.getFirstLinkpathDest(linkpath, options.sourcePath) ??
        options.app.vault.getAbstractFileByPath(normalizePath(linkpath));

      if (!(file instanceof TFile)) {
        return null;
      }

      const bytes = await options.app.vault.readBinary(file);
      const mime = MIME_BY_EXTENSION[file.extension.toLowerCase()] ?? 'application/octet-stream';
      return (await encodeImageDataUri(bytes, mime, encodeOptions)).dataUri;
    } catch {
      return null;
    }
  };
}
