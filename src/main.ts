import { Plugin } from 'obsidian';
import { getGlobalMarkdownParser, setGlobalMarkdownHtml, setupMathJax } from './core/markdown/render';
import { getGlobalI18n, setGlobalLang } from './i18n';
import { addIcons } from './icons';
import { PublishDeps, publishActiveNote } from './publish';
import { showError } from './platform/notices';
import { DEFAULT_SETTINGS, PluginSettings, upgradeSettings } from './settings';
import { PublishModal } from './ui/modals/publish-modal';
import { BloggerSettingsTab } from './ui/settings-tab';

export default class GoogleBloggerPublisher extends Plugin {
  settings: PluginSettings = DEFAULT_SETTINGS;

  onload = async (): Promise<void> => {
    await this.loadSettings();
    setGlobalLang(this.settings.lang);
    addIcons();
    setupMathJax(getGlobalMarkdownParser(), this.settings.mathJaxOutputType);
    setGlobalMarkdownHtml(this.settings.enableHtml);

    if (this.settings.showRibbonIcon) {
      this.addRibbonIcon('blogger-logo', getGlobalI18n().t('ribbon_iconTitle'), () =>
        this.publishLive(),
      );
    }

    this.addCommand({
      id: 'publishWithDefault',
      name: getGlobalI18n().t('command_publishWithDefault'),
      editorCallback: () => this.publishWithDefault(),
    });
    this.addCommand({
      id: 'publishLive',
      name: getGlobalI18n().t('command_publish'),
      editorCallback: () => this.publishLive(),
    });

    this.addSettingTab(
      new BloggerSettingsTab({
        app: this.app,
        plugin: this,
        getSettings: () => this.settings,
        saveSettings: this.saveSettings,
        manageProfiles: () => this.openProfiles(),
      }),
    );
  };

  onunload = (): void => {};

  loadSettings = async (): Promise<void> => {
    this.settings = upgradeSettings(await this.loadData());
  };

  saveSettings = async (): Promise<void> => {
    await this.saveData(this.settings);
  };

  // Commands -----------------------------------------------------------------
  private publishDeps(): PublishDeps {
    return { app: this.app, settings: this.settings, saveSettings: this.saveSettings };
  }

  private publishWithDefault = async (): Promise<void> => {
    const profile =
      this.settings.profiles.find((p) => p.isDefault) ?? this.settings.profiles[0];
    if (!profile) {
      showError(getGlobalI18n().t('error_noProfile'));
      return;
    }
    await publishActiveNote(this.publishDeps(), profile, this.settings.defaultPostStatus);
  };

  private publishLive = async (): Promise<void> => {
    if (this.settings.profiles.length === 0) {
      showError(getGlobalI18n().t('error_noProfile'));
      return;
    }
    const file = this.app.workspace.getActiveFile();
    new PublishModal({
      app: this.app,
      settings: this.settings,
      profiles: this.settings.profiles,
      noteTitle: file?.basename ?? '',
      onSubmit: ({ profile, status }) =>
        publishActiveNote(this.publishDeps(), profile, status),
    }).open();
  };

  private openProfiles(): void {}
}
