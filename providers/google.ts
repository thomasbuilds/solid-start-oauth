import { encode } from "../utils";
import type { Parameters, Google, Token } from "../types";

export const provider = "google";

export function requestCode({ id, redirect, state }: Parameters) {
  const url = "https://accounts.google.com/o/oauth2/v2/auth";
  const params = encode({
    scope: ["profile", "email"],
    response_type: "code",
    access_type: "offline",
    client_id: id,
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
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: encode({
      client_id: id,
      client_secret: secret,
      grant_type: "authorization_code",
      code: code,
      redirect_uri: redirect,
    }),
  });
  return await response.json();
}

export async function requestUser({ token_type, access_token }: Token) {
  const response = await fetch(
    "https://www.googleapis.com/oauth2/v3/userinfo",
    { headers: { Authorization: token_type + " " + access_token } }
  );
  const data = await response.json();
  if (response.status !== 200) throw new Error(data.message);
  const { given_name, email, picture } = data as Google;
  return { name: given_name, email: email.toLowerCase(), image: picture };
}
