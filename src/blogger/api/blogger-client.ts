import { BLOGGER_API_ENDPOINT } from '../../consts';
import { PostStatus, SafeAny } from '../../core/types';
import { getGlobalI18n } from '../../i18n';
import { OAuth2Client } from '../oauth2/client';
import { InternalOAuth2Token } from '../oauth2/token';
import { BloggerProfile } from '../profile';
import { statusChangeAction } from './post-status';
import { RestClient } from './rest-client';
import {
  BloggerClientResult,
  BloggerClientReturnCode,
  BloggerPostParams,
  BloggerPublishResult,
} from './types';

export interface BloggerApiClientDeps {
  profile: BloggerProfile;
  oauth2: OAuth2Client;
  /** Persist a refreshed token back to the profile. */
  onTokenRefreshed: (token: InternalOAuth2Token) => Promise<void>;
}

export class BloggerApiClient {
  private readonly rest: RestClient;

  constructor(private readonly deps: BloggerApiClientDeps) {
    this.rest = new RestClient(BLOGGER_API_ENDPOINT);
  }

  async publish(
    title: string,
    content: string,
    params: BloggerPostParams,
  ): Promise<BloggerClientResult<BloggerPublishResult>> {
    const t = getGlobalI18n();
    const token = await this.freshToken();
    const headers = { authorization: `Bearer ${token.accessToken}` };
    const blogId = this.deps.profile.blogId;
    const body = {
      kind: 'blogger#post',
      blog: { id: blogId },
      title,
      content,
      labels: params.labels ?? [],
      status: params.status,
    };

    const response: SafeAny = params.postId
      ? await this.rest.request('PUT', `/${blogId}/posts/${params.postId}`, { headers, body })
      : await this.rest.request(
          'POST',
          `/${blogId}/posts?isDraft=${params.status === PostStatus.Draft}`,
          { headers, body },
        );

    if (response?.error) {
      return {
        code: BloggerClientReturnCode.Error,
        message: t.t('error_requestFailed', {
          code: String(response.error.code),
          message: String(response.error.message),
        }),
        response,
      };
    }

    // `posts.update` (PUT) does not change status; switch it explicitly.
    if (params.postId) {
      const action = statusChangeAction(params.status, response.status);
      if (action !== 'none') {
        const actionResponse: SafeAny = await this.rest.request(
          'POST',
          `/${blogId}/posts/${params.postId}/${action}`,
          { headers, body: {} },
        );
        if (actionResponse && !actionResponse.error && actionResponse.status) {
          response.status = actionResponse.status;
        }
      }
    }

    if (!response?.id) {
      return {
        code: BloggerClientReturnCode.Error,
        message: t.t('error_cannotParseResponse'),
        response,
      };
    }

    return {
      code: BloggerClientReturnCode.OK,
      data: { postId: response.id, url: response.url, status: response.status },
      response,
    };
  }

  private async freshToken(): Promise<InternalOAuth2Token> {
    const current = this.deps.profile.googleOAuth2Token;
    const fresh = await this.deps.oauth2.ensureFresh(current);
    if (fresh !== current) {
      this.deps.profile.googleOAuth2Token = fresh;
      await this.deps.onTokenRefreshed(fresh);
    }
    return fresh;
  }
}
