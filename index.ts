import { useLocation, useSearchParams } from "solid-start";
import { type APIEvent, redirect } from "solid-start/api";
import { encode } from "./utils";
import * as github from "./providers/github";
import * as google from "./providers/google";
import * as discord from "./providers/discord";
import * as spotify from "./providers/spotify";
import type { Provider, Configuration } from "./types";

export function useOAuthLogin() {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  return (path: string) => {
    if (typeof path !== "string" || !path) throw new Error("invalid path");
    const params = encode({
      fallback: location.pathname,
      redirect: searchParams.redirect,
    });
    return `/api/${path}?${params}`;
  };
}

export default function OAuth(config: Configuration) {
  const request = requestProvider(config);
  if (!config.handler)
    throw new Error("handler function missing in configuration");
  return async ({ request: { url }, params: { oauth } }: APIEvent) => {
    switch (oauth) {
      case "google":
        return request(google, new URL(url));
      case "github":
        return request(github, new URL(url));
      case "spotify":
        return request(spotify, new URL(url));
      case "discord":
        return request(discord, new URL(url));
    }
  };
}

function requestProvider(config: Configuration) {
  const params: Record<string, string> = {};
  return async (
    { provider, requestCode, requestToken, requestUser }: Provider,
    { searchParams, origin, pathname }: URL
  ) => {
    const identifiers = config[provider];
    if (!identifiers?.id || !identifiers?.secret)
      throw new Error(`malformed ${provider} configuration`);
    const configAPI = { ...identifiers, redirect: origin + pathname };
    if (searchParams.has("fallback")) {
      const errorURL = searchParams.get("fallback");
      const redirectURL = searchParams.get("redirect");
      if (typeof errorURL !== "string" || !errorURL)
        throw new Error("no fallback path specified");
      params.fallback = errorURL;
      if (typeof redirectURL === "string" && redirectURL)
        params.redirect = redirectURL;
      return redirect(requestCode(configAPI));
    }
    try {
      const token = await requestToken(searchParams, configAPI);
      const user = await requestUser(token);
      return await config.handler(user, params.redirect);
    } catch ({ message }: any) {
      return redirect(`${params.fallback}?error=${message}`);
    }
  };
}

export type { User, Configuration } from "./types";
