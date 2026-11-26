export const PostStatus = {
  Draft: 'DRAFT',
  Live: 'LIVE',
  Scheduled: 'SCHEDULED',
  SoftTrashed: 'SOFT_TRASHED',
} as const;
export type PostStatus = (typeof PostStatus)[keyof typeof PostStatus];

export const MathJaxOutputType = {
  TeX: 'tex',
  SVG: 'svg',
} as const;
export type MathJaxOutputType = (typeof MathJaxOutputType)[keyof typeof MathJaxOutputType];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type SafeAny = any;

export type MatterData = { [p: string]: SafeAny };
