import { useAuth0 } from "@auth0/auth0-react";

export function useAuth() {
  const {
    loginWithRedirect,
    logout,
    isAuthenticated,
    isLoading,
    user,
  } = useAuth0();

  const login = () => {
    return loginWithRedirect();
  };

  const register = () => {
    return loginWithRedirect({
      authorizationParams: {
        screen_hint: "signup",
      },
    });
  };

  const signOut = () => {
    return logout({
      logoutParams: {
        returnTo: window.location.origin,
      },
    });
  };

  return {
    login,
    register,
    signOut,
    isAuthenticated,
    isLoading,
    user,
  };
}