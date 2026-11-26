import { App, ButtonComponent, Modal, Setting } from 'obsidian';
import { BloggerProfile } from '../../blogger/profile';
import { PostStatus } from '../../core/types';
import { getGlobalI18n } from '../../i18n';
import { PluginSettings } from '../../settings';

export interface PublishModalResult {
  profile: BloggerProfile;
  status: PostStatus;
}

export interface PublishModalDeps {
  app: App;
  settings: PluginSettings;
  profiles: BloggerProfile[];
  noteTitle: string;
  /** Returns whether the note was published; the modal closes only on success. */
  onSubmit: (result: PublishModalResult) => Promise<boolean>;
}

export class PublishModal extends Modal {
  private profile: BloggerProfile;
  private status: PostStatus;

  constructor(private readonly deps: PublishModalDeps) {
    super(deps.app);
    this.profile = deps.profiles.find((p) => p.isDefault) ?? deps.profiles[0];
    this.status = deps.settings.defaultPostStatus;
  }

  onOpen(): void {
    this.render();
  }

  onClose(): void {
    this.contentEl.empty();
  }

  private render(): void {
    const t = getGlobalI18n();
    const { contentEl } = this;
    contentEl.empty();
    contentEl.createEl('h1', { text: t.t('publishModal_title') });
    if (this.deps.noteTitle) {
      contentEl.createEl('p', { text: this.deps.noteTitle, cls: 'gbp-publish-note' });
    }

    if (this.deps.profiles.length > 1) {
      new Setting(contentEl).setName(t.t('publishModal_profile')).addDropdown((dropdown) => {
        this.deps.profiles.forEach((p) =>
          dropdown.addOption(p.name, p.isDefault ? `${p.name} ★` : p.name),
        );
        dropdown.setValue(this.profile.name).onChange((value) => {
          this.profile = this.deps.profiles.find((p) => p.name === value) ?? this.profile;
        });
      });
    }

    const statusSetting = new Setting(contentEl).setName(t.t('publishModal_status'));
    const segmented = statusSetting.controlEl.createDiv({ cls: 'gbp-segmented' });
    const options: { value: PostStatus; el: HTMLButtonElement }[] = [];
    const sync = (): void => {
      options.forEach((o) => o.el.toggleClass('is-active', o.value === this.status));
    };
    const add = (label: string, value: PostStatus): void => {
      const el = segmented.createEl('button', { text: label, cls: 'gbp-segmented-btn' });
      el.onclick = () => {
        this.status = value;
        sync();
      };
      options.push({ value, el });
    };
    add(t.t('settings_defaultStatusDraft'), PostStatus.Draft);
    add(t.t('settings_defaultStatusLive'), PostStatus.Live);
    sync();

    contentEl.createEl('p', { text: t.t('publishModal_inherited'), cls: 'setting-item-description' });

    new Setting(contentEl).addButton((button) =>
      button
        .setButtonText(t.t('publishModal_publish'))
        .setCta()
        .onClick(() => void this.submit(button)),
    );
  }

  private async submit(button: ButtonComponent): Promise<void> {
    button.setDisabled(true);
    button.buttonEl.addClass('gbp-publishing');
    button.buttonEl.empty();
    button.buttonEl.createSpan({ cls: 'gbp-spinner' });
    try {
      const published = await this.deps.onSubmit({ profile: this.profile, status: this.status });
      if (published) {
        this.close();
        return;
      }
    } finally {
      button.setDisabled(false);
      button.buttonEl.removeClass('gbp-publishing');
      button.buttonEl.setText(getGlobalI18n().t('publishModal_publish'));
    }
  }
}
