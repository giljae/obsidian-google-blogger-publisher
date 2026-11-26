import { App, Plugin, PluginSettingTab, Setting } from 'obsidian';
import { ImageOutputFormat } from '../core/image/encode-image';
import { getGlobalMarkdownParser, setGlobalMarkdownHtml, setupMathJax } from '../core/markdown/render';
import { MathJaxOutputType, PostStatus } from '../core/types';
import { TranslateKey, getGlobalI18n } from '../i18n';
import { PluginSettings } from '../settings';
import { renderSection } from './components/section';

export interface SettingsTabDeps {
  app: App;
  plugin: Plugin;
  getSettings: () => PluginSettings;
  saveSettings: () => Promise<void>;
  manageProfiles: () => void;
}

export class BloggerSettingsTab extends PluginSettingTab {
  constructor(private readonly deps: SettingsTabDeps) {
    super(deps.app, deps.plugin);
  }

  display(): void {
    const t = (key: TranslateKey, vars?: Record<string, string>): string =>
      getGlobalI18n().t(key, vars);
    const settings = this.deps.getSettings();
    const save = this.deps.saveSettings;
    const { containerEl } = this;
    containerEl.empty();

    // ---- Account ----
    renderSection(containerEl, t('settings_account'));
    new Setting(containerEl)
      .setName(t('settings_clientId'))
      .setDesc(t('settings_clientIdDesc'))
      .addText((text) =>
        text.setValue(settings.clientId ?? '').onChange(async (value) => {
          settings.clientId = value;
          await save();
        }),
      );
    new Setting(containerEl)
      .setName(t('settings_clientSecret'))
      .setDesc(t('settings_clientSecretDesc'))
      .addText((text) =>
        text.setValue(settings.clientSecret ?? '').onChange(async (value) => {
          settings.clientSecret = value;
          await save();
        }),
      );

    // ---- Profiles ----
    renderSection(containerEl, t('settings_profiles'));
    new Setting(containerEl)
      .setName(t('settings_profiles'))
      .setDesc(`${settings.profiles.length}`)
      .addButton((button) =>
        button
          .setButtonText(t('settings_manage'))
          .setCta()
          .onClick(() => this.deps.manageProfiles()),
      );

    // ---- Publishing defaults ----
    renderSection(containerEl, t('settings_publishing'));
    new Setting(containerEl)
      .setName(t('settings_defaultStatus'))
      .setDesc(t('settings_defaultStatusDesc'))
      .addDropdown((dropdown) =>
        dropdown
          .addOption(PostStatus.Draft, t('settings_defaultStatusDraft'))
          .addOption(PostStatus.Live, t('settings_defaultStatusLive'))
          .setValue(settings.defaultPostStatus)
          .onChange(async (value) => {
            settings.defaultPostStatus = value as PostStatus;
            await save();
          }),
      );
    new Setting(containerEl)
      .setName(t('settings_openAfterPublish'))
      .setDesc(t('settings_openAfterPublishDesc'))
      .addToggle((toggle) =>
        toggle.setValue(settings.openPublishedPageWithBrowser).onChange(async (value) => {
          settings.openPublishedPageWithBrowser = value;
          await save();
        }),
      );

    // ---- Content & images ----
    renderSection(containerEl, t('settings_contentImages'));
    new Setting(containerEl)
      .setName(t('settings_enableHtml'))
      .setDesc(t('settings_enableHtmlDesc'))
      .addToggle((toggle) =>
        toggle.setValue(settings.enableHtml).onChange(async (value) => {
          settings.enableHtml = value;
          setGlobalMarkdownHtml(value);
          await save();
        }),
      );
    new Setting(containerEl)
      .setName(t('settings_mathJaxOutput'))
      .setDesc(t('settings_mathJaxOutputDesc'))
      .addDropdown((dropdown) =>
        dropdown
          .addOption(MathJaxOutputType.TeX, t('settings_mathJaxTeX'))
          .addOption(MathJaxOutputType.SVG, t('settings_mathJaxSVG'))
          .setValue(settings.mathJaxOutputType)
          .onChange(async (value) => {
            settings.mathJaxOutputType = value as MathJaxOutputType;
            setupMathJax(getGlobalMarkdownParser(), settings.mathJaxOutputType);
            await save();
            this.display();
          }),
      );
    new Setting(containerEl)
      .setName(t('settings_embedImages'))
      .setDesc(t('settings_embedImagesDesc'))
      .addToggle((toggle) =>
        toggle.setValue(settings.embedLocalImages).onChange(async (value) => {
          settings.embedLocalImages = value;
          await save();
        }),
      );
    new Setting(containerEl)
      .setName(t('settings_imageMaxWidth'))
      .setDesc(t('settings_imageMaxWidthDesc'))
      .addText((text) => {
        text.inputEl.type = 'number';
        text.inputEl.min = '100';
        text.setValue(String(settings.imageMaxWidth)).onChange(async (value) => {
          const parsed = Number.parseInt(value, 10);
          if (!Number.isNaN(parsed) && parsed >= 100) {
            settings.imageMaxWidth = parsed;
            await save();
          }
        });
      });
    new Setting(containerEl)
      .setName(t('settings_imageQuality'))
      .setDesc(t('settings_imageQualityDesc'))
      .addText((text) => {
        text.inputEl.type = 'number';
        text.inputEl.min = '0.1';
        text.inputEl.max = '1';
        text.inputEl.step = '0.05';
        text.setValue(String(settings.imageQuality)).onChange(async (value) => {
          const parsed = Number.parseFloat(value);
          if (!Number.isNaN(parsed) && parsed > 0 && parsed <= 1) {
            settings.imageQuality = parsed;
            await save();
          }
        });
      });
    new Setting(containerEl)
      .setName(t('settings_imageFormat'))
      .setDesc(t('settings_imageFormatDesc'))
      .addDropdown((dropdown) =>
        dropdown
          .addOption('auto', t('settings_imageFormatAuto'))
          .addOption('jpeg', t('settings_imageFormatJpeg'))
          .addOption('png', t('settings_imageFormatPng'))
          .addOption('webp', t('settings_imageFormatWebp'))
          .setValue(settings.imageFormat)
          .onChange(async (value) => {
            settings.imageFormat = value as ImageOutputFormat;
            await save();
          }),
      );
    new Setting(containerEl)
      .setName(t('settings_autoFit'))
      .setDesc(t('settings_autoFitDesc'))
      .addToggle((toggle) =>
        toggle.setValue(settings.autoFitPostSize).onChange(async (value) => {
          settings.autoFitPostSize = value;
          await save();
        }),
      );
    new Setting(containerEl)
      .setName(t('settings_svgColor'))
      .setDesc(t('settings_svgColorDesc'))
      .addText((text) =>
        text.setValue(settings.svgTextColor).onChange(async (value) => {
          settings.svgTextColor = value.trim();
          await save();
        }),
      );
  }
}
