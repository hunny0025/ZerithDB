import { createAuth0Client } from "@auth0/auth0-spa-js";
import { AuthManager } from "zerithdb-auth";
import type { Auth0Config, ZerithAuth0Identity } from "./types.js";

type JwtHeader = {
  alg?: string;
  kid?: string;
  typ?: string;
};

type JwtPayload = {
  iss?: string;
  aud?: string | string[];
  exp?: number;
  nbf?: number;
  sub?: string;
  email?: string;
  name?: string;
  [key: string]: unknown;
};

type JwksResponse = {
  keys: JsonWebKey[];
};

const JWKS_TTL_MS = 5 * 60 * 1000;
const jwksCache = new Map<string, { keys: JsonWebKey[]; fetchedAt: number }>();

export async function signInWithAuth0(config: Auth0Config): Promise<ZerithAuth0Identity> {
  const client = await createAuth0Client({
    domain: config.domain,
    clientId: config.clientId,
    authorizationParams: buildAuthParams(config),
  });

  if (!(await client.isAuthenticated())) {
    await client.loginWithPopup({
      authorizationParams: buildAuthParams(config),
    });
  }

  const accessToken = await client.getTokenSilently({
    authorizationParams: buildAuthParams(config),
  });
  const claims = (await client.getIdTokenClaims()) as JwtPayload | undefined;
  const payload = claims ?? decodeJwt(accessToken).payload;

  const sub = payload.sub;
  if (!sub) {
    throw new Error("Auth0 token missing sub claim.");
  }

  const authManager = new AuthManager({
    appId: `auth0:${config.clientId}`,
    auth: { storageKey: buildStorageKey(config, sub) },
  });

  const identity = await authManager.signIn();

  return {
    ...identity,
    sub,
    email: typeof payload.email === "string" ? payload.email : undefined,
    name: typeof payload.name === "string" ? payload.name : undefined,
    accessToken,
  };
}

export async function verifyAuth0Token(token: string, config: Auth0Config): Promise<boolean> {
  let decoded: ReturnType<typeof decodeJwt>;
  try {
    decoded = decodeJwt(token);
  } catch {
    return false;
  }

  const { header, payload, signature, signingInput } = decoded;
  if (header.alg !== "RS256" || !header.kid) return false;
  if (!validateClaims(payload, config)) return false;

  const jwk = await getJwk(config.domain, header.kid);
  if (!jwk) return false;
  if (!globalThis.crypto?.subtle) {
    throw new Error("WebCrypto is unavailable.");
  }

  const key = await crypto.subtle.importKey(
    "jwk",
    jwk,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["verify"]
  );

  const data = new TextEncoder().encode(signingInput);
  return await crypto.subtle.verify("RSASSA-PKCS1-v1_5", key, signature as any, data as any);
}

export type { Auth0Config, ZerithAuth0Identity } from "./types.js";

function buildAuthParams(config: Auth0Config): { audience?: string; redirect_uri: string } {
  return {
    audience: config.audience,
    redirect_uri: config.redirectUri ?? window.location.origin,
  };
}

function buildStorageKey(config: Auth0Config, sub: string): string {
  const safeDomain = config.domain.replace(/[^a-z0-9_-]/gi, "_");
  return `__zerithdb_auth0_${safeDomain}_${sub}`;
}

function decodeJwt(token: string): {
  header: JwtHeader;
  payload: JwtPayload;
  signature: Uint8Array;
  signingInput: string;
} {
  const parts = token.split(".");
  if (parts.length !== 3) {
    throw new Error("Invalid JWT format.");
  }

  const [headerB64, payloadB64, signatureB64] = parts;
  const header = JSON.parse(base64UrlToString(headerB64)) as JwtHeader;
  const payload = JSON.parse(base64UrlToString(payloadB64)) as JwtPayload;

  return {
    header,
    payload,
    signature: base64UrlToBytes(signatureB64),
    signingInput: `${headerB64}.${payloadB64}`,
  };
}

function validateClaims(payload: JwtPayload, config: Auth0Config): boolean {
  const issuer = `https://${config.domain}/`;
  if (payload.iss !== issuer) return false;

  if (config.audience) {
    if (typeof payload.aud === "string") {
      if (payload.aud !== config.audience) return false;
    } else if (Array.isArray(payload.aud)) {
      if (!payload.aud.includes(config.audience)) return false;
    } else {
      return false;
    }
  }

  const now = Math.floor(Date.now() / 1000);
  if (typeof payload.exp === "number" && payload.exp < now) return false;
  if (typeof payload.nbf === "number" && payload.nbf > now) return false;

  return true;
}

async function getJwk(domain: string, kid: string): Promise<JsonWebKey | null> {
  const keys = await getJwks(domain);
  return keys.find((key: any) => key.kid === kid) ?? null;
}

async function getJwks(domain: string): Promise<JsonWebKey[]> {
  const cached = jwksCache.get(domain);
  const now = Date.now();

  if (cached && now - cached.fetchedAt < JWKS_TTL_MS) {
    return cached.keys;
  }

  const response = await fetch(`https://${domain}/.well-known/jwks.json`);
  if (!response.ok) {
    throw new Error("Failed to fetch Auth0 JWKS.");
  }

  const data = (await response.json()) as JwksResponse;
  jwksCache.set(domain, { keys: data.keys, fetchedAt: now });
  return data.keys;
}

function base64UrlToString(input: string): string {
  const bytes = base64UrlToBytes(input);
  return new TextDecoder().decode(bytes);
}

function base64UrlToBytes(input: string): Uint8Array {
  const base64 = input.replace(/-/g, "+").replace(/_/g, "/").padEnd(padLength(input), "=");

  if (typeof atob === "function") {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }

  throw new Error("No base64 decoder available.");
}

function padLength(input: string): number {
  const rem = input.length % 4;
  return rem === 0 ? input.length : input.length + (4 - rem);
}
