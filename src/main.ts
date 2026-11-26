import { Plugin } from 'obsidian';
import { getGlobalMarkdownParser, setGlobalMarkdownHtml, setupMathJax } from './core/markdown/render';
import { getGlobalI18n, setGlobalLang } from './i18n';
import { addIcons } from './icons';
import { DEFAULT_SETTINGS, PluginSettings, upgradeSettings } from './settings';

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
  };

  onunload = (): void => {};

  loadSettings = async (): Promise<void> => {
    this.settings = upgradeSettings(await this.loadData());
  };

  saveSettings = async (): Promise<void> => {
    await this.saveData(this.settings);
  };

  // Filled in by later tasks.
  private publishWithDefault(): void {}
  private publishLive(): void {}
}
