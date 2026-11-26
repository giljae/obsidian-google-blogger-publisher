export interface EmbedLocalImagesDeps {
  resolveImage: (src: string) => Promise<string | null>;
  isAbsolute?: (src: string) => boolean;
  onError?: (src: string, error: unknown) => void;
}

export interface EmbedLocalImagesResult {
  html: string;
  embedded: number;
  failed: number;
}

/**
 * A src is absolute (and must be left alone) if it has a URL scheme
 * (`http:`, `https:`, `data:`, `app:`, …) or is protocol-relative (`//`).
 */
export const DEFAULT_IS_ABSOLUTE = (src: string): boolean =>
  /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(src);

/**
 * Replace the `src` of every local image in the HTML with the data URI
 * returned by `deps.resolveImage`. Absolute URLs are left untouched, each
 * unique src is resolved once, and a src that cannot be resolved keeps its
 * original value and is counted in `failed`.
 */
export async function embedLocalImages(
  html: string,
  deps: EmbedLocalImagesDeps,
): Promise<EmbedLocalImagesResult> {
  const isAbsolute = deps.isAbsolute ?? DEFAULT_IS_ABSOLUTE;
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const images = Array.from(doc.body.querySelectorAll('img'));

  const cache = new Map<string, Promise<string | null>>();
  const resolve = (src: string): Promise<string | null> => {
    let pending = cache.get(src);
    if (!pending) {
      pending = deps.resolveImage(src);
      cache.set(src, pending);
    }
    return pending;
  };

  let embedded = 0;
  let failed = 0;

  await Promise.all(
    images.map(async (image) => {
      const src = image.getAttribute('src');
      if (!src || isAbsolute(src)) {
        return;
      }
      try {
        const dataUri = await resolve(src);
        if (dataUri) {
          image.setAttribute('src', dataUri);
          embedded++;
        } else {
          failed++;
        }
      } catch (error) {
        failed++;
        deps.onError?.(src, error);
      }
    }),
  );

  return { html: doc.body.innerHTML, embedded, failed };
}
