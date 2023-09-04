import {
  type APIEvent,
  redirect,
  useLocation,
  useSearchParams,
} from "solid-start";
import providers, { type Providers } from "./providers";
import { encode, formatEnv } from "./utils";
import type { Configuration, Methods } from "./types";

export default function OAuth(configuration: Configuration) {
  let errorURL: string;
  let redirectURL: string | undefined;

  return async ({ request: { url }, params, env }: APIEvent) => {
    const config =
      typeof configuration === "function"
        ? configuration(formatEnv(env))
        : configuration;
    const [provider] = Object.values(params);
    const { searchParams, origin, pathname } = new URL(url);

    if (!config.handler)
      return new Response("handler function missing in configuration");

    const methods = providers[provider as Providers];
    if (!methods) return new Response(`'${provider}' provider doesn't exist`);
    const { requestCode, requestToken, requestUser }: Methods = methods;

    const clientConfig = config[provider as Providers];
    if (!clientConfig.id || !clientConfig.secret)
      return new Response(`${provider} configuration is malformed`);

    const apiConfig = { ...clientConfig, redirect_uri: origin + pathname };

    const fallback = searchParams.get("fallback");
    if (fallback) {
      errorURL = fallback;
      redirectURL = searchParams.get("redirect") || undefined;
      return redirect(requestCode(apiConfig));
    }

    try {
      const error = searchParams.get("error");
      if (error) throw new Error(error);
      const code = searchParams.get("code");
      if (!code) throw new Error("missing code parameter in url");
      const { token_type, access_token } = await requestToken({
        ...apiConfig,
        code,
      });
      const user = await requestUser(`${token_type} ${access_token}`);
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
