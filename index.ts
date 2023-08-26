import { useLocation, useSearchParams } from "solid-start";
import { type APIEvent, redirect } from "solid-start/api";
import * as github from "./providers/github";
import * as google from "./providers/google";
import * as discord from "./providers/discord";
import * as spotify from "./providers/spotify";
import { encode } from "./utils";
import type { Provider, Configuration, Providers } from "./types";

export default function OAuth(config: Configuration) {
  const login = handleProviders(config);
  if (!config.handler) throw new TypeError("handler missing in configuration");
  return async ({ request: { url }, params }: APIEvent) => {
    const [provider] = Object.values(params);
    switch (provider) {
      case "google":
        return login(google, new URL(url));
      case "github":
        return login(github, new URL(url));
      case "spotify":
        return login(spotify, new URL(url));
      case "discord":
        return login(discord, new URL(url));
    }
  };
}

function handleProviders(config: Configuration) {
  let errorURL: string;
  let redirectURL: string | undefined;
  return async (
    { provider, requestCode, requestToken, requestUser }: Provider,
    { searchParams, origin, pathname }: URL
  ) => {
    const identifiers = config[provider];
    if (!identifiers?.id || !identifiers?.secret)
      throw new TypeError(`malformed ${provider} configuration`);
    const configAPI = { ...identifiers, redirect: origin + pathname };
    if (searchParams.has("fallback")) {
      const fallback = searchParams.get("fallback");
      if (typeof fallback !== "string" || !fallback)
        throw new Error("fallback path missing");
      errorURL = fallback;
      redirectURL = searchParams.get("redirect") ?? undefined;
      return redirect(requestCode(configAPI));
    }
    try {
      const token = await requestToken(searchParams, configAPI);
      const user = await requestUser(token);
      return await config.handler(user, redirectURL);
    } catch ({ message }: any) {
      return redirect(`${errorURL}?error=${message}`);
    }
  };
}

export function useOAuthLogin(folder?: string) {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  return (provider: Providers) => {
    const params = encode({
      fallback: location.pathname,
      redirect: searchParams.redirect,
    });
    const path = folder ? folder + "/" : "";
    return `/api/${path}${provider}?${params}`;
  };
}

export type { User, Configuration } from "./types";
