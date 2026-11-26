import { App, TFile } from 'obsidian';
import { BloggerApiClient } from './blogger/api/blogger-client';
import { isMissingPostResult } from './blogger/api/post-status';
import { BloggerPostParams } from './blogger/api/types';
import { OAuth2Client } from './blogger/oauth2/client';
import { BloggerProfile } from './blogger/profile';
import { postProcessHtml } from './core/markdown/post-process-html';
import { getGlobalMarkdownParser } from './core/markdown/render';
import { autoFitPostSize } from './core/size/auto-fit';
import {
  BLOGGER_REQUEST_LIMIT,
  BloggerSizeStatus,
  DEFAULT_WARN_THRESHOLD,
  checkPostSize,
  estimatePostRequestBytes,
} from './core/size/blogger-size';
import { PostStatus } from './core/types';
import { getGlobalI18n } from './i18n';
import { openExternal } from './platform/browser';
import { createObsidianImageResolver } from './platform/image-resolver';
import { showError, showProgress, showSuccess } from './platform/notices';
import { readNote, writePostMeta } from './platform/vault';
import { isPluginSettingsWithOAuth2, PluginSettings } from './settings';
import { ConfirmCode, openConfirmModal } from './ui/modals/confirm-modal';

export interface BuildContentInput {
  rendered: string;
  settings: PluginSettings;
  title: string;
  labels: string[];
  sourcePath: string;
  app: App;
}

export interface BuiltContent {
  html: string;
  bytes: number;
  failedImages: number;
  status: BloggerSizeStatus;
}

const formatMiB = (bytes: number): string => `${(bytes / (1024 * 1024)).toFixed(2)} MiB`;

/** Post-process rendered HTML (tables, images, SVG) and evaluate its size. */
export async function buildContent(
  input: BuildContentInput,
  overrides?: { quality?: number; maxWidth?: number },
): Promise<BuiltContent> {
  const { settings, app } = input;
  const resolver = settings.embedLocalImages
    ? createObsidianImageResolver({
        app,
        sourcePath: input.sourcePath,
        maxWidth: overrides?.maxWidth ?? settings.imageMaxWidth,
        quality: overrides?.quality ?? settings.imageQuality,
        format: settings.imageFormat,
      })
    : undefined;

  const processed = await postProcessHtml(input.rendered, {
    images: resolver ? { resolveImage: resolver } : undefined,
    svgTextColor: settings.svgTextColor,
  });

  const html = `<div class="obsidian-blogger-post">${processed.html}</div>`;
  const bytes = estimatePostRequestBytes({
    title: input.title,
    content: html,
    labels: input.labels,
  });

  return { html, bytes, failedImages: processed.failedImages, status: checkPostSize(bytes) };
}

export interface PublishDeps {
  app: App;
  settings: PluginSettings;
  saveSettings: () => Promise<void>;
}

/** Publish the active note to Blogger. Returns whether a post was published. */
export async function publishActiveNote(
  deps: PublishDeps,
  profile: BloggerProfile,
  status: PostStatus,
): Promise<boolean> {
  const t = getGlobalI18n();
  const { app, settings } = deps;

  const file = app.workspace.getActiveFile();
  if (!file) {
    showError(t.t('error_noActiveFile'));
    return false;
  }

  const progress = showProgress(t.t('message_publishing'));
  try {
    const { content, matter } = await readNote(app, file);
    const title = typeof matter.title === 'string' && matter.title ? matter.title : file.basename;
    const labels = Array.isArray(matter.labels) ? (matter.labels as string[]) : [];
    let postId = typeof matter.postId === 'string' ? matter.postId : undefined;

    // If the note was last published under a different profile, ask the user.
    const previousProfile = typeof matter.profileName === 'string' ? matter.profileName : '';
    if (previousProfile && previousProfile !== profile.name) {
      const confirm = await openConfirmModal(
        {
          message: t.t('error_profileNotMatch'),
          cancelText: t.t('profileNotMatch_useOld', { profileName: previousProfile }),
          confirmText: t.t('profileNotMatch_useNew', { profileName: profile.name }),
        },
        app,
      );
      if (confirm.code !== ConfirmCode.Cancel) {
        postId = undefined;
      }
    }

    const rendered = getGlobalMarkdownParser().render(content);
    let failedImages = 0;
    const rebuild = async (
      quality: number,
      maxWidth: number,
    ): Promise<{ html: string; bytes: number }> => {
      const built = await buildContent(
        { rendered, settings, title, labels, sourcePath: file.path, app },
        { quality, maxWidth },
      );
      failedImages = built.failedImages;
      return { html: built.html, bytes: built.bytes };
    };

    let html: string;
    let bytes: number;
    if (settings.autoFitPostSize && settings.embedLocalImages) {
      const fitted = await autoFitPostSize({
        limit: BLOGGER_REQUEST_LIMIT,
        targetBytes: DEFAULT_WARN_THRESHOLD,
        initialQuality: settings.imageQuality,
        initialMaxWidth: settings.imageMaxWidth,
        build: ({ quality, maxWidth }) => rebuild(quality, maxWidth),
      });
      html = fitted.html;
      bytes = fitted.bytes;
      if (!fitted.fits) {
        showError(
          t.t('error_postSizeExceeded', {
            size: formatMiB(bytes),
            limit: formatMiB(BLOGGER_REQUEST_LIMIT),
          }),
        );
        return false;
      }
      if (fitted.compressed) {
        showSuccess(t.t('message_imagesAutoCompressed', { size: formatMiB(bytes) }));
      }
    } else {
      const built = await rebuild(settings.imageQuality, settings.imageMaxWidth);
      html = built.html;
      bytes = built.bytes;
      const status = checkPostSize(bytes);
      if (status === 'over') {
        showError(
          t.t('error_postSizeExceeded', {
            size: formatMiB(bytes),
            limit: formatMiB(BLOGGER_REQUEST_LIMIT),
          }),
        );
        return false;
      }
      if (status === 'warn') {
        const confirm = await openConfirmModal(
          {
            message: t.t('warning_postSizeMessage', {
              size: formatMiB(bytes),
              limit: formatMiB(BLOGGER_REQUEST_LIMIT),
            }),
            cancelText: t.t('confirmModal_cancel'),
            confirmText: t.t('confirmModal_confirm'),
          },
          app,
        );
        if (confirm.code === ConfirmCode.Cancel) {
          return false;
        }
      }
    }

    if (failedImages > 0) {
      showSuccess(t.t('message_imagesEmbedFailed', { count: String(failedImages) }));
    }

    if (!isPluginSettingsWithOAuth2(settings)) {
      showError(t.t('error_noOAuth2ClientCredentials'));
      return false;
    }

    const oauth2 = new OAuth2Client({
      clientId: settings.clientId,
      clientSecret: settings.clientSecret,
    });
    const client = new BloggerApiClient({
      profile,
      oauth2,
      onTokenRefreshed: async (token) => {
        profile.googleOAuth2Token = token;
        await deps.saveSettings();
      },
    });

    const params: BloggerPostParams = {
      status,
      labels,
      title,
      content: html,
      postId,
      profileName: profile.name,
    };

    let result = await client.publish(title, html, params);
    if (postId && isMissingPostResult(result)) {
      showSuccess(t.t('message_postTrashedRecreating', { postId }));
      params.postId = undefined;
      result = await client.publish(title, html, params);
    }

    if (result.code !== 'OK') {
      showError(t.t('error_publishFailed', { message: result.message }));
      return false;
    }

    showSuccess(t.t('message_publishSuccessfully'));
    const resultFile: TFile | null = app.workspace.getActiveFile();
    if (resultFile) {
      await writePostMeta(app, resultFile, {
        postId: result.data.postId,
        profileName: profile.name,
      });
    }
    if (settings.openPublishedPageWithBrowser && result.data.url) {
      openExternal(result.data.url);
    }
    return true;
  } catch (e) {
    showError(e);
    return false;
  } finally {
    progress.hide();
  }
}
