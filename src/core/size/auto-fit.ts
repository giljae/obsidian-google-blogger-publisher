export interface AutoFitParams {
  quality: number;
  maxWidth: number;
}

export interface AutoFitBuildResult {
  html: string;
  bytes: number;
}

export interface AutoFitOptions {
  /** Hard limit; above this the post cannot be published. */
  limit: number;
  /** Aim below this so we land safely under the limit. */
  targetBytes: number;
  initialQuality: number;
  initialMaxWidth: number;
  minQuality?: number;
  minWidth?: number;
  maxAttempts?: number;
  build: (params: AutoFitParams) => Promise<AutoFitBuildResult>;
}

export interface AutoFitResult {
  html: string;
  bytes: number;
  quality: number;
  maxWidth: number;
  attempts: number;
  /** Whether the final result is under the hard limit. */
  fits: boolean;
  /** Whether any reduction (more than one attempt) was needed. */
  compressed: boolean;
}

const QUALITY_STEP = 0.7;
const WIDTH_STEP = 0.85;

/**
 * Repeatedly rebuild the post with lower image quality/max width until its
 * estimated request size drops below `targetBytes` (or the budget of
 * attempts/quality/width runs out). Returns the best attempt; `fits` tells
 * the caller whether it is publishable at all.
 */
export async function autoFitPostSize(options: AutoFitOptions): Promise<AutoFitResult> {
  const minQuality = options.minQuality ?? 0.3;
  const minWidth = options.minWidth ?? 600;
  const maxAttempts = options.maxAttempts ?? 5;

  let quality = options.initialQuality;
  let maxWidth = options.initialMaxWidth;
  let last: AutoFitResult | undefined;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const { html, bytes } = await options.build({ quality, maxWidth });
    last = {
      html,
      bytes,
      quality,
      maxWidth,
      attempts: attempt,
      fits: bytes <= options.limit,
      compressed: attempt > 1,
    };
    if (bytes <= options.targetBytes || attempt === maxAttempts) {
      break;
    }
    const nextQuality = Math.max(minQuality, Number((quality * QUALITY_STEP).toFixed(3)));
    const nextWidth = Math.max(minWidth, Math.round(maxWidth * WIDTH_STEP));
    if (nextQuality === quality && nextWidth === maxWidth) {
      break;
    }
    quality = nextQuality;
    maxWidth = nextWidth;
  }

  // `last` is always set because maxAttempts >= 1.
  return last as AutoFitResult;
}
