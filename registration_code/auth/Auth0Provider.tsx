import { Auth0Provider as Provider } from "@auth0/auth0-react" 
import { createElement, type ReactNode } from "react";

interface AuthProviderProps {
  children: ReactNode;
}

const { VITE_AUTH0_DOMAIN: domain, VITE_AUTH0_CLIENT_ID: clientId } = (
  import.meta as ImportMeta & {
    readonly env: {
      readonly VITE_AUTH0_DOMAIN?: string;
      readonly VITE_AUTH0_CLIENT_ID?: string;
    };
  }
).env;

export default function Auth0Provider({
  children,
}: AuthProviderProps) {
  if (!domain || !clientId) {
    throw new Error("Missing Auth0 configuration");
  }

  return createElement(
    Provider,
    {
      domain,
      clientId,
      authorizationParams: {
        redirect_uri: window.location.origin,
      },
    },
    children,
  );
}