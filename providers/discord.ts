import { encode } from "../utils";
import type { Parameters, Discord, Token } from "../types";

export const provider = "discord";

export function requestCode({ id, state }: Parameters) {
  const url = "https://discord.com/oauth2/authorize";
  const params = encode({
    response_type: "code",
    scope: ["identify", "email"],
    client_id: id,
    state: state,
    prompt: "none",
  });
  return url + "?" + params;
}

export async function requestToken(
  searchParams: URLSearchParams,
  { id, secret }: Parameters
) {
  const code = searchParams.get("code");
  const error = searchParams.get("error");
  if (!code) throw new Error("missing code parameter in url");
  if (error) throw new Error(error);
  const response = await fetch("https://discord.com/api/v10/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: encode({
      client_id: id,
      client_secret: secret,
      code: code,
      grant_type: "authorization_code",
    }),
  });
  return await response.json();
}

export async function requestUser({ token_type, access_token }: Token) {
  const response = await fetch("https://discord.com/api/v10/users/@me", {
    headers: { Authorization: token_type + " " + access_token },
  });
  const data = await response.json();
  if (response.status !== 200) throw new Error(data.message);
  const { id, username, email, avatar } = data as Discord;
  return {
    name: username,
    email: email.toLowerCase(),
    image: `https://cdn.discordapp.com/avatars/${id}/${avatar}.png`,
  };
}
