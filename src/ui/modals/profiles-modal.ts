import { App, Modal, Setting } from 'obsidian';
import { OAuth2Client } from '../../blogger/oauth2/client';
import { BloggerProfile } from '../../blogger/profile';
import { fetchBlogId, isValidBlogspotUrl } from '../../blogger/api/blog-id';
import { getGlobalI18n } from '../../i18n';
import { showError } from '../../platform/notices';
import { PluginSettings } from '../../settings';
import { renderStatusBadge } from '../components/status-badge';
import { renderProfileForm } from './profile-form';

export interface ProfilesModalDeps {
  app: App;
  getSettings: () => PluginSettings;
  saveSettings: () => Promise<void>;
  getOAuth2: () => OAuth2Client;
}

export class ProfilesModal extends Modal {
  private selected = 0;
  private adding = false;
  private draft: Partial<BloggerProfile> | null = null;

  constructor(private readonly deps: ProfilesModalDeps) {
    super(deps.app);
  }

  onOpen(): void {
    this.render();
  }

  onClose(): void {
    this.contentEl.empty();
  }

  private render(): void {
    const t = getGlobalI18n();
    const settings = this.deps.getSettings();
    const profiles = settings.profiles;
    const { contentEl } = this;
    contentEl.empty();
    contentEl.addClass('gbp-profiles-modal');

    const header = contentEl.createDiv({ cls: 'gbp-profiles-header' });
    header.createEl('h1', { text: t.t('profiles_title') });
    const addButton = header.createEl('button', { text: `+ ${t.t('profiles_add')}`, cls: 'mod-cta' });
    addButton.onclick = () => {
      this.adding = true;
      this.selected = -1;
      this.draft = { isDefault: profiles.length === 0 };
      this.render();
    };

    const body = contentEl.createDiv({ cls: 'gbp-profiles-body' });
    const list = body.createDiv({ cls: 'gbp-profiles-list' });
    const form = body.createDiv({ cls: 'gbp-profiles-form' });

    if (profiles.length === 0 && !this.adding) {
      list.createEl('p', { text: t.t('profiles_empty'), cls: 'gbp-empty' });
      return;
    }

    if (!this.adding && this.selected >= profiles.length) {
      this.selected = profiles.length - 1;
    }

    profiles.forEach((profile, index) => {
      const item = list.createDiv({
        cls: `gbp-profile-item${index === this.selected && !this.adding ? ' is-selected' : ''}`,
      });
      item.createDiv({
        cls: 'gbp-profile-name',
        text: profile.isDefault ? `${profile.name} ★` : profile.name,
      });
      item.createDiv({ cls: 'gbp-profile-domain', text: profile.endpoint });
      renderStatusBadge(
        item,
        Boolean(profile.googleOAuth2Token),
        t.t('profiles_connected'),
        t.t('profiles_needsAuth'),
      );
      item.onclick = () => {
        this.adding = false;
        this.selected = index;
        this.draft = { ...profile };
        this.render();
      };
    });

    if (this.adding) {
      this.draft = this.draft ?? { isDefault: profiles.length === 0 };
    } else {
      this.draft = { ...profiles[this.selected] };
    }

    renderProfileForm(form, this.draft, {
      oAuth2: this.deps.getOAuth2(),
      onChange: () => {},
    });

    new Setting(form)
      .addButton((button) =>
        button
          .setButtonText(t.t('profiles_delete'))
          .setClass('mod-warning')
          .onClick(() => void this.deleteProfile()),
      )
      .addButton((button) =>
        button
          .setButtonText(t.t('profiles_save'))
          .setCta()
          .onClick(() => void this.saveProfile()),
      );
  }

  private async deleteProfile(): Promise<void> {
    if (this.adding) {
      this.adding = false;
      this.selected = Math.max(0, this.deps.getSettings().profiles.length - 1);
      this.render();
      return;
    }
    const settings = this.deps.getSettings();
    const wasDefault = settings.profiles[this.selected]?.isDefault;
    settings.profiles.splice(this.selected, 1);
    if (wasDefault && settings.profiles.length > 0) {
      settings.profiles[0].isDefault = true;
    }
    this.selected = Math.max(0, this.selected - 1);
    await this.deps.saveSettings();
    this.render();
  }

  private async saveProfile(): Promise<void> {
    const t = getGlobalI18n();
    const settings = this.deps.getSettings();
    const draft = this.draft;
    if (!draft) {
      return;
    }
    if (!draft.name) {
      showError(t.t('error_noProfileName'));
      return;
    }
    if (!draft.endpoint || !isValidBlogspotUrl(draft.endpoint)) {
      showError(t.t('error_notGoogle'));
      return;
    }
    if (!draft.googleOAuth2Token) {
      showError(t.t('error_invalidGoogleToken'));
      return;
    }
    try {
      const fresh = await this.deps.getOAuth2().ensureFresh(draft.googleOAuth2Token);
      const blogId = await fetchBlogId(draft.endpoint, fresh);
      const full: BloggerProfile = {
        name: draft.name,
        endpoint: draft.endpoint,
        blogId,
        googleOAuth2Token: fresh,
        isDefault: draft.isDefault ?? false,
      };
      if (this.adding) {
        if (settings.profiles.length === 0) {
          full.isDefault = true;
        }
        settings.profiles.push(full);
        this.selected = settings.profiles.length - 1;
        this.adding = false;
      } else {
        settings.profiles[this.selected] = full;
      }
      if (full.isDefault) {
        settings.profiles.forEach((p) => {
          if (p !== full) {
            p.isDefault = false;
          }
        });
      }
      await this.deps.saveSettings();
      this.draft = null;
      this.render();
    } catch (e) {
      showError(e);
    }
  }
}
