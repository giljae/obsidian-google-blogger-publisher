import { Setting } from 'obsidian';
import { isValidBlogspotUrl } from '../../blogger/api/blog-id';
import { OAuth2Client } from '../../blogger/oauth2/client';
import { authorizeOnLocalhost } from '../../blogger/oauth2/desktop-redirect';
import { BloggerProfile } from '../../blogger/profile';
import { getGlobalI18n } from '../../i18n';
import { openExternal } from '../../platform/browser';

export interface ProfileFormDeps {
  oAuth2: OAuth2Client;
  /** Called whenever the form mutates the profile. */
  onChange: () => void;
}

/**
 * Render the editable form for one profile into `container`. The passed
 * `profile` object is mutated in place.
 */
export function renderProfileForm(
  container: HTMLElement,
  profile: Partial<BloggerProfile>,
  deps: ProfileFormDeps,
): void {
  const t = getGlobalI18n();
  container.empty();

  new Setting(container)
    .setName(t.t('profiles_name'))
    .setDesc(t.t('profiles_nameDesc'))
    .addText((text) =>
      text
        .setPlaceholder(t.t('profiles_name'))
        .setValue(profile.name ?? '')
        .onChange((value) => {
          profile.name = value;
          deps.onChange();
        }),
    );

  new Setting(container)
    .setName(t.t('profiles_blogUrl'))
    .setDesc(t.t('profiles_blogUrlDesc'))
    .addText((text) =>
      text
        .setPlaceholder(t.t('profiles_blogUrlPlaceholder'))
        .setValue(profile.endpoint ?? '')
        .onChange((value) => {
          profile.endpoint = value;
          deps.onChange();
        }),
    );

  new Setting(container)
    .setName(t.t('profiles_account'))
    .setDesc(profile.googleOAuth2Token ? t.t('profiles_connected') : t.t('profiles_needsAuth'))
    .addButton((button) =>
      button
        .setButtonText(
          profile.googleOAuth2Token ? t.t('profiles_reauthorize') : t.t('profiles_authorize'),
        )
        .onClick(() => {
          const endpoint = profile.endpoint;
          if (!endpoint || !isValidBlogspotUrl(endpoint)) {
            return;
          }
          void authorizeOnLocalhost(deps.oAuth2, endpoint, {
            openUrl: (url) => openExternal(url),
            notify: () => {},
          })
            .then((token) => {
              profile.googleOAuth2Token = token;
              deps.onChange();
            })
            .catch(() => {});
        }),
    )
    .addButton((button) =>
      button.setButtonText(t.t('profiles_validate')).onClick(() => {
        if (profile.googleOAuth2Token) {
          void deps.oAuth2.validate(profile.googleOAuth2Token.accessToken).catch(() => {});
        }
      }),
    );

  new Setting(container).setName(t.t('profiles_default')).addToggle((toggle) =>
    toggle.setValue(profile.isDefault ?? false).onChange((value) => {
      profile.isDefault = value;
      deps.onChange();
    }),
  );
}
