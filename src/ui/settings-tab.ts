import { PluginSettingTab, SettingDefinitionAction, SettingDefinitionItem } from 'obsidian';
import { getGlobalMarkdownParser, setGlobalMarkdownHtml, setupMathJax } from '../core/markdown/render';
import { MathJaxOutputType, PostStatus } from '../core/types';
import { TranslateKey, getGlobalI18n } from '../i18n';
import { PluginSettings } from '../settings';

export interface SettingsTabDeps {
  app: import('obsidian').App;
  plugin: import('obsidian').Plugin;
  getSettings: () => PluginSettings;
  saveSettings: () => Promise<void>;
  manageProfiles: () => void;
}

export class BloggerSettingsTab extends PluginSettingTab {
  constructor(private readonly deps: SettingsTabDeps) {
    super(deps.app, deps.plugin);
  }

  getSettingDefinitions(): SettingDefinitionItem[] {
    const t = (key: TranslateKey): string => getGlobalI18n().t(key);
    const settings = this.deps.getSettings();

    const manageAction: SettingDefinitionAction = {
      name: t('settings_profiles'),
      desc: String(settings.profiles.length),
      action: () => this.deps.manageProfiles(),
    };

    return [
      {
        type: 'group',
        heading: t('settings_account'),
        items: [
          {
            name: t('settings_clientId'),
            desc: t('settings_clientIdDesc'),
            control: { type: 'text', key: 'clientId' },
          },
          {
            name: t('settings_clientSecret'),
            desc: t('settings_clientSecretDesc'),
            control: { type: 'text', key: 'clientSecret' },
          },
        ],
      },
      {
        type: 'group',
        heading: t('settings_profiles'),
        items: [manageAction],
      },
      {
        type: 'group',
        heading: t('settings_publishing'),
        items: [
          {
            name: t('settings_defaultStatus'),
            desc: t('settings_defaultStatusDesc'),
            control: {
              type: 'dropdown',
              key: 'defaultPostStatus',
              options: {
                [PostStatus.Draft]: t('settings_defaultStatusDraft'),
                [PostStatus.Live]: t('settings_defaultStatusLive'),
              },
            },
          },
          {
            name: t('settings_openAfterPublish'),
            desc: t('settings_openAfterPublishDesc'),
            control: { type: 'toggle', key: 'openPublishedPageWithBrowser' },
          },
        ],
      },
      {
        type: 'group',
        heading: t('settings_contentImages'),
        items: [
          {
            name: t('settings_enableHtml'),
            desc: t('settings_enableHtmlDesc'),
            control: { type: 'toggle', key: 'enableHtml' },
          },
          {
            name: t('settings_mathJaxOutput'),
            desc: t('settings_mathJaxOutputDesc'),
            control: {
              type: 'dropdown',
              key: 'mathJaxOutputType',
              options: {
                [MathJaxOutputType.TeX]: t('settings_mathJaxTeX'),
                [MathJaxOutputType.SVG]: t('settings_mathJaxSVG'),
              },
            },
          },
          {
            name: t('settings_embedImages'),
            desc: t('settings_embedImagesDesc'),
            control: { type: 'toggle', key: 'embedLocalImages' },
          },
          {
            name: t('settings_imageMaxWidth'),
            desc: t('settings_imageMaxWidthDesc'),
            control: { type: 'number', key: 'imageMaxWidth', min: 100 },
          },
          {
            name: t('settings_imageQuality'),
            desc: t('settings_imageQualityDesc'),
            control: { type: 'number', key: 'imageQuality', min: 0.1, max: 1, step: 0.05 },
          },
          {
            name: t('settings_imageFormat'),
            desc: t('settings_imageFormatDesc'),
            control: {
              type: 'dropdown',
              key: 'imageFormat',
              options: {
                auto: t('settings_imageFormatAuto'),
                jpeg: t('settings_imageFormatJpeg'),
                png: t('settings_imageFormatPng'),
                webp: t('settings_imageFormatWebp'),
              },
            },
          },
          {
            name: t('settings_autoFit'),
            desc: t('settings_autoFitDesc'),
            control: { type: 'toggle', key: 'autoFitPostSize' },
          },
          {
            name: t('settings_svgColor'),
            desc: t('settings_svgColorDesc'),
            control: { type: 'text', key: 'svgTextColor' },
          },
        ],
      },
    ];
  }

  getControlValue(key: string): unknown {
    return (this.deps.getSettings() as unknown as Record<string, unknown>)[key];
  }

  setControlValue(key: string, value: unknown): void | Promise<void> {
    const settings = this.deps.getSettings() as unknown as Record<string, unknown>;
    settings[key] = key === 'svgTextColor' && typeof value === 'string' ? value.trim() : value;

    if (key === 'enableHtml') {
      setGlobalMarkdownHtml(Boolean(value));
    } else if (key === 'mathJaxOutputType') {
      setupMathJax(getGlobalMarkdownParser(), value as MathJaxOutputType);
    }
    return this.deps.saveSettings();
  }
}
