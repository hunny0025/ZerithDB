# Auth0 integration with ZerithDB

This guide shows how to attach Auth0 identity to ZerithDB peers and gate sync rooms based on Auth0
JWTs.

## Prerequisites

1. Create an Auth0 account and tenant.
2. Create a Single Page Application (SPA) in Auth0.
3. Add allowed callback URLs and web origins for your app.

## Install

```bash
pnpm add zerithdb-auth-auth0
```

## Configure Auth0

You will need:

- `domain` (for example: `your-tenant.auth0.com`)
- `clientId`
- Optional `audience` if you are using an API in Auth0

## Client example

```ts
import { createApp } from "zerithdb-sdk";
import { signInWithAuth0 } from "zerithdb-auth-auth0";

const app = createApp({ appId: "my-app" });

const identity = await signInWithAuth0({
  domain: "your-tenant.auth0.com",
  clientId: "YOUR_CLIENT_ID",
  audience: "https://api.yourapp.com",
  redirectUri: window.location.origin,
});

console.log(identity.sub, identity.email);
const accessToken = identity.accessToken;

app.sync.enable();
```

## Gate sync room access

Use the Auth0 access token to decide whether a peer can join a room. The simplest place to enforce
this is in your signaling server or a backend endpoint that hands out room tokens.

```ts
import { verifyAuth0Token } from "zerithdb-auth-auth0";

export async function allowJoin(accessToken: string): Promise<boolean> {
  return verifyAuth0Token(accessToken, {
    domain: "your-tenant.auth0.com",
    clientId: "YOUR_CLIENT_ID",
    audience: "https://api.yourapp.com",
  });
}
```

## Common pitfalls

- Ensure the callback URL and web origin are listed in the Auth0 app settings.
- If you use an audience, it must match the one configured in Auth0.
- Tokens expire; handle refresh or re-authentication on the client.
- `verifyAuth0Token` uses WebCrypto and `fetch`, so it must run in an environment that provides
  them.
