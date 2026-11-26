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

/** Parsed YAML front matter of a note. */
export type MatterData = Record<string, unknown>;
