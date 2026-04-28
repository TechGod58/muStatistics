import { createHash, randomBytes } from 'node:crypto';
import { createRemoteJWKSet, jwtVerify } from 'jose';

export type MuRole = 'student' | 'professor';

export type OidcConfig = {
  enabled: boolean;
  providerName: string;
  issuer: string;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scopes: string[];
  allowedEmailDomain: string | null;
  expectedAudience: string;
  allowUserInfoFallback: boolean;
};

export type OidcProviderMetadata = {
  issuer: string;
  authorization_endpoint: string;
  token_endpoint: string;
  userinfo_endpoint?: string;
  jwks_uri?: string;
};

export type OidcIdentity = {
  username: string;
  email: string | null;
  displayName: string | null;
};

export function normalizeMuUsername(value: string): string {
  return value.trim().toLowerCase().replace(/@.*$/, '');
}

export function resolveMuRole(value: unknown): MuRole {
  return value === 'professor' ? 'professor' : 'student';
}

export function resolveOidcConfig(env: NodeJS.ProcessEnv): OidcConfig {
  const scopes = (env.OIDC_SCOPES ?? 'openid profile email')
    .split(/[,\s]+/)
    .map((value) => value.trim())
    .filter(Boolean);

  const issuer = env.OIDC_ISSUER?.trim() ?? '';
  const clientId = env.OIDC_CLIENT_ID?.trim() ?? '';
  const redirectUri = env.OIDC_REDIRECT_URI?.trim() ?? '';

  return {
    enabled: Boolean(issuer && clientId && redirectUri),
    providerName: env.OIDC_PROVIDER_NAME?.trim() || 'MU Single Sign-On',
    issuer,
    clientId,
    clientSecret: env.OIDC_CLIENT_SECRET?.trim() ?? '',
    redirectUri,
    scopes,
    allowedEmailDomain: env.OIDC_ALLOWED_EMAIL_DOMAIN?.trim().toLowerCase() || null,
    expectedAudience: env.OIDC_EXPECTED_AUDIENCE?.trim() || clientId,
    allowUserInfoFallback: ['1', 'true'].includes(String(env.OIDC_ALLOW_USERINFO_FALLBACK ?? '').toLowerCase())
  };
}

export function buildOidcDiscoveryUrl(issuer: string): string {
  return `${issuer.replace(/\/+$/, '')}/.well-known/openid-configuration`;
}

export async function fetchOidcProviderMetadata(config: OidcConfig): Promise<OidcProviderMetadata> {
  const response = await fetch(buildOidcDiscoveryUrl(config.issuer), {
    signal: AbortSignal.timeout(10000)
  });
  if (!response.ok) {
    throw new Error(`OIDC discovery failed with status ${response.status}.`);
  }
  const payload = await response.json() as Partial<OidcProviderMetadata>;
  if (!payload.issuer || !payload.authorization_endpoint || !payload.token_endpoint) {
    throw new Error('OIDC discovery response is missing required endpoints.');
  }
  return {
    issuer: payload.issuer,
    authorization_endpoint: payload.authorization_endpoint,
    token_endpoint: payload.token_endpoint,
    userinfo_endpoint: payload.userinfo_endpoint,
    jwks_uri: payload.jwks_uri
  };
}

export async function verifyOidcIdToken(params: {
  config: OidcConfig;
  metadata: OidcProviderMetadata;
  idToken: string;
}): Promise<Record<string, unknown>> {
  if (!params.metadata.jwks_uri) {
    throw new Error('OIDC discovery metadata is missing jwks_uri for ID token verification.');
  }
  const jwks = createRemoteJWKSet(new URL(params.metadata.jwks_uri));
  const { payload } = await jwtVerify(params.idToken, jwks, {
    issuer: params.config.issuer,
    audience: params.config.expectedAudience
  });
  return payload as Record<string, unknown>;
}

export function buildPkcePair(): { verifier: string; challenge: string } {
  const verifier = randomBytes(32).toString('base64url');
  const challenge = createHash('sha256').update(verifier).digest('base64url');
  return { verifier, challenge };
}

export function createOidcState(): string {
  return randomBytes(16).toString('hex');
}

export function buildOidcAuthorizationUrl(params: {
  config: OidcConfig;
  metadata: OidcProviderMetadata;
  state: string;
  codeChallenge: string;
}): string {
  const url = new URL(params.metadata.authorization_endpoint);
  url.searchParams.set('client_id', params.config.clientId);
  url.searchParams.set('redirect_uri', params.config.redirectUri);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('scope', params.config.scopes.join(' '));
  url.searchParams.set('state', params.state);
  url.searchParams.set('code_challenge', params.codeChallenge);
  url.searchParams.set('code_challenge_method', 'S256');
  return url.toString();
}

export async function exchangeOidcCode(params: {
  config: OidcConfig;
  metadata: OidcProviderMetadata;
  code: string;
  codeVerifier: string;
}): Promise<Record<string, unknown>> {
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: params.config.clientId,
    redirect_uri: params.config.redirectUri,
    code: params.code,
    code_verifier: params.codeVerifier
  });

  if (params.config.clientSecret) {
    body.set('client_secret', params.config.clientSecret);
  }

  const response = await fetch(params.metadata.token_endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body
  });

  if (!response.ok) {
    throw new Error(`OIDC token exchange failed with status ${response.status}.`);
  }

  return await response.json() as Record<string, unknown>;
}

export function decodeJwtPayload(token: string): Record<string, unknown> {
  const parts = token.split('.');
  if (parts.length < 2) throw new Error('Invalid JWT payload.');
  const payload = parts[1].replace(/-/g, '+').replace(/_/g, '/');
  const padded = payload.padEnd(Math.ceil(payload.length / 4) * 4, '=');
  return JSON.parse(Buffer.from(padded, 'base64').toString('utf8')) as Record<string, unknown>;
}

export async function resolveOidcIdentity(params: {
  config: OidcConfig;
  metadata: OidcProviderMetadata;
  tokenResponse: Record<string, unknown>;
}): Promise<OidcIdentity> {
  const idToken = typeof params.tokenResponse.id_token === 'string' ? params.tokenResponse.id_token : '';
  let claims: Record<string, unknown> = {};
  if (idToken) {
    claims = await verifyOidcIdToken({
      config: params.config,
      metadata: params.metadata,
      idToken
    });
  } else if (!params.config.allowUserInfoFallback) {
    throw new Error('OIDC token response did not include id_token. Enable OIDC_ALLOW_USERINFO_FALLBACK only if your provider requires it.');
  }

  let email = typeof claims.email === 'string' ? claims.email : null;
  let preferredUsername = typeof claims.preferred_username === 'string' ? claims.preferred_username : '';
  let displayName = typeof claims.name === 'string' ? claims.name : null;

  if ((!email || !preferredUsername) && params.metadata.userinfo_endpoint) {
    const accessToken = typeof params.tokenResponse.access_token === 'string' ? params.tokenResponse.access_token : '';
    if (accessToken) {
      const response = await fetch(params.metadata.userinfo_endpoint, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (response.ok) {
        const userInfo = await response.json() as Record<string, unknown>;
        email = email ?? (typeof userInfo.email === 'string' ? userInfo.email : null);
        preferredUsername = preferredUsername || (typeof userInfo.preferred_username === 'string' ? userInfo.preferred_username : '');
        displayName = displayName ?? (typeof userInfo.name === 'string' ? userInfo.name : null);
      }
    }
  }

  const usernameSource = preferredUsername || email || '';
  const username = normalizeMuUsername(usernameSource);
  if (!username) throw new Error('OIDC response did not include a usable MU username.');

  if (params.config.allowedEmailDomain && email && !email.toLowerCase().endsWith(`@${params.config.allowedEmailDomain}`)) {
    throw new Error(`Only ${params.config.allowedEmailDomain} accounts may sign in through MU SSO.`);
  }

  return { username, email, displayName };
}
