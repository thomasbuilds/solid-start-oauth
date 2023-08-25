import { encode } from "../utils";
import type { Parameters, Spotify, Token } from "../types";

export const provider = "spotify";

export function requestCode({ id, redirect, state }: Parameters) {
  const url = "https://accounts.spotify.com/authorize";
  const params = encode({
    response_type: "code",
    client_id: id,
    scope: "user-read-email",
    redirect_uri: redirect,
    state: state,
  });
  return url + "?" + params;
}

export async function requestToken(
  searchParams: URLSearchParams,
  { id, secret, redirect }: Parameters
) {
  const code = searchParams.get("code");
  const error = searchParams.get("error");
  if (!code) throw new Error("missing code parameter in url");
  if (error) throw new Error(error);
  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: "Basic " + btoa(id + ":" + secret),
    },
    body: encode({
      code: code,
      grant_type: "authorization_code",
      redirect_uri: redirect,
    }),
  });
  return await response.json();
}

export async function requestUser({ token_type, access_token }: Token) {
  const response = await fetch("https://api.spotify.com/v1/me", {
    headers: { Authorization: token_type + " " + access_token },
  });
  const data = await response.json();
  if (response.status !== 200) throw new Error(data.message);
  const { display_name, email, images } = data as Spotify;
  return {
    name: display_name,
    email: email.toLowerCase(),
    image: images?.[0]?.url,
  };
}
