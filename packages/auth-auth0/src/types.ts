import type { Identity } from "zerithdb-core";

export interface Auth0Config {
  domain: string;
  clientId: string;
  audience?: string;
  redirectUri?: string;
}

export interface ZerithAuth0Identity extends Identity {
  sub: string;
  email?: string;
  name?: string;
  accessToken?: string;
}
