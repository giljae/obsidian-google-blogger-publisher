export interface OAuth2Token {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
  refreshToken: string;
  scope: string;
}

export interface InternalOAuth2Token extends OAuth2Token {
  expiresAt: number;
}

export type FreshInternalOAuth2Token = InternalOAuth2Token & {
  __brand: 'FreshInternalOAuth2Token';
};

export const isFreshInternalOAuth2Token = (
  token: InternalOAuth2Token,
): token is FreshInternalOAuth2Token => {
  return token.expiresAt > Date.now();
};
