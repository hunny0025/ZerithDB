# zerithdb-auth-auth0

Auth0 integration for ZerithDB peer identities. This package adds a human identity layer (Auth0 user
claims) on top of ZerithDB's keypair-based identity.

## Install

```bash
pnpm add zerithdb-auth-auth0
```

## Quick start

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

## Gate access with Auth0 tokens

On your signaling server or API layer, verify incoming tokens before allowing peers to join a room.

```ts
import { verifyAuth0Token } from "zerithdb-auth-auth0";

const ok = await verifyAuth0Token(accessToken ?? "", {
  domain: "your-tenant.auth0.com",
  clientId: "YOUR_CLIENT_ID",
  audience: "https://api.yourapp.com",
});

if (!ok) {
  throw new Error("Unauthorized");
}
```

## Notes

- `signInWithAuth0` uses the Auth0 SPA SDK and opens a popup login if needed.
- `accessToken` is returned on the identity object for convenience. Avoid persisting it outside
  memory.
