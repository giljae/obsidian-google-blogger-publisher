import { BloggerProfile } from './blogger/profile';
import { ImageOutputFormat } from './core/image/encode-image';
import { DEFAULT_SVG_TEXT_COLOR } from './core/markdown/svg-color';
import { MathJaxOutputType, PostStatus } from './core/types';
import { LanguageWithAuto } from './i18n';

export type SettingsVersion = '1';

export interface PluginSettings {
  version: SettingsVersion;

  /** UI language. */
  lang: LanguageWithAuto;

  /** Configured Blogger profiles. */
  profiles: BloggerProfile[];

  /** Show the ribbon icon. */
  showRibbonIcon: boolean;

  /** Default status for new posts. */
  defaultPostStatus: PostStatus;

  /** Open the published post in the browser. */
  openPublishedPageWithBrowser: boolean;

  /** How math is rendered. */
  mathJaxOutputType: MathJaxOutputType;

  /** Render raw HTML embedded in notes. */
  enableHtml: boolean;

  /** Embed local vault images as base64 data URIs. */
  embedLocalImages: boolean;

  /** Downscale images wider than this (px). */
  imageMaxWidth: number;

  /** Re-encode quality for lossy formats (0.1–1.0). */
  imageQuality: number;

  /** Output format when re-encoding images. */
  imageFormat: ImageOutputFormat;

  /** Lower image size/quality until the post fits Blogger's limit. */
  autoFitPostSize: boolean;

  /** Color applied to embedded SVG diagrams (empty disables recoloring). */
  svgTextColor: string;

  /** Google OAuth2 client credentials. */
  clientId?: string;
  clientSecret?: string;
}

export type PluginSettingsWithOAuth2 = PluginSettings & {
  clientId: string;
  clientSecret: string;
};

export const isPluginSettingsWithOAuth2 = (
  settings: PluginSettings,
): settings is PluginSettingsWithOAuth2 => Boolean(settings.clientId && settings.clientSecret);

export const DEFAULT_SETTINGS: PluginSettings = {
  version: '1',
  lang: 'auto',
  profiles: [],
  showRibbonIcon: false,
  defaultPostStatus: PostStatus.Draft,
  openPublishedPageWithBrowser: false,
  mathJaxOutputType: MathJaxOutputType.SVG,
  enableHtml: false,
  embedLocalImages: true,
  imageMaxWidth: 1600,
  imageQuality: 0.8,
  imageFormat: 'auto',
  autoFitPostSize: true,
  svgTextColor: DEFAULT_SVG_TEXT_COLOR,
};

/** Merge stored data with defaults, filling any field added in a later version. */
export function upgradeSettings(existing: unknown): PluginSettings {
  const data = (existing ?? {}) as Partial<PluginSettings>;
  return { ...DEFAULT_SETTINGS, ...data };
}
