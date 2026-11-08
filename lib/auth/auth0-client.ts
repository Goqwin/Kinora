import "server-only";

import { Auth0Client } from "@auth0/nextjs-auth0/server";

import { getEnv } from "@/lib/env";

export function isAuthConfigured(): boolean {
  const env = getEnv();
  return Boolean(
    env.AUTH0_SECRET &&
      env.AUTH0_DOMAIN &&
      env.AUTH0_CLIENT_ID &&
      env.AUTH0_CLIENT_SECRET &&
      env.APP_BASE_URL,
  );
}

let client: Auth0Client | null | undefined;

export function getAuth0(): Auth0Client | null {
  if (!isAuthConfigured()) return null;
  if (client === undefined) {
    client = new Auth0Client();
  }
  return client;
}
