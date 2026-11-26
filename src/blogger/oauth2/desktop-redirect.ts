import { createServer } from 'http';
import { GOOGLE_OAUTH2_REDIRECT_URI_LOCAL } from '../../consts';
import { OAuth2Client } from './client';
import { generateCodeVerifier } from './pkce';
import { InternalOAuth2Token } from './token';

export interface DesktopAuthorizeDeps {
  /** Open the consent URL in the user's browser. */
  openUrl: (url: string) => void;
  /** Report progress/errors to the user. */
  notify: (message: string) => void;
}

const listeningPort = (server: ReturnType<typeof createServer>): number => {
  const address = server.address();
  if (!address || typeof address === 'string') {
    throw new Error('Could not determine the local redirect server port.');
  }
  return address.port;
};

/**
 * Desktop OAuth2 flow: start a throwaway localhost server, open Google's
 * consent page, and resolve with the tokens once Google redirects back.
 */
export function authorizeOnLocalhost(
  client: OAuth2Client,
  blogEndpoint: string,
  deps: DesktopAuthorizeDeps,
): Promise<InternalOAuth2Token> {
  return new Promise<InternalOAuth2Token>((resolve, reject) => {
    const codeVerifier = generateCodeVerifier();
    const state = crypto.randomUUID();
    const server = createServer();
    let settled = false;

    const finish = (error: Error | undefined, token?: InternalOAuth2Token): void => {
      if (settled) {
        return;
      }
      settled = true;
      server.close();
      if (error) {
        reject(error);
      } else if (token) {
        resolve(token);
      }
    };

    server.on('request', (req, res) => {
      const closeWith = (message: string): void => {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(`<html><head><title>Blogger OAuth2</title></head><body><p>${message}</p></body></html>`);
      };

      void (async () => {
        try {
          const url = new URL(req.url ?? '/', GOOGLE_OAUTH2_REDIRECT_URI_LOCAL);
          const params = url.searchParams;
          if (params.get('error')) {
            closeWith('Authorization failed.');
            finish(new Error(`Google authorization failed: ${params.get('error')}`));
            return;
          }
          if (params.get('state') !== state) {
            closeWith('Authorization state mismatch.');
            finish(new Error('Google authorization state did not match.'));
            return;
          }
          const code = params.get('code');
          if (!code) {
            closeWith('No authorization code received.');
            finish(new Error('No authorization code received.'));
            return;
          }
          const token = await client.exchangeToken({
            code,
            redirectUri: `${GOOGLE_OAUTH2_REDIRECT_URI_LOCAL}:${listeningPort(server)}`,
            codeVerifier,
          });
          closeWith('Authorized. You can close this tab.');
          finish(undefined, token);
        } catch (e) {
          closeWith('Authorization failed.');
          finish(e instanceof Error ? e : new Error(String(e)));
        }
      })();
    });

    server.listen(0, () => {
      const redirectUri = `${GOOGLE_OAUTH2_REDIRECT_URI_LOCAL}:${listeningPort(server)}`;
      void client
        .authorizeUrl({ redirectUri, state, codeVerifier, blog: blogEndpoint })
        .then((url) => deps.openUrl(url))
        .catch((e) => finish(e instanceof Error ? e : new Error(String(e))));
    });
  });
}
