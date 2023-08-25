import { encode } from "../utils";
import type { Parameters, GitHubUser, GithubEmails, Token } from "../types";

export const provider = "github";

export function requestCode({ id, state }: Parameters) {
  const url = "https://github.com/login/oauth/authorize";
  const params = encode({
    client_id: id,
    scope: "user:email",
    state: state,
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
  const params = encode({
    client_id: id,
    client_secret: secret,
    code: code,
  });
  const response = await fetch(
    `https://github.com/login/oauth/access_token?${params}`,
    { method: "POST", headers: { Accept: "application/json" } }
  );
  //maybe add the data.msg also here ?
  return await response.json();
}

export async function requestUser(token: Token) {
  const { name, avatar_url } = (await queryAPI("/user", token)) as GitHubUser;
  const emails = (await queryAPI("/user/emails", token)) as GithubEmails;
  const { email } = emails.find(({ primary }) => primary === true)!;
  return { name: name, email: email.toLowerCase(), image: avatar_url };
}

async function queryAPI(
  path: "/user" | "/user/emails",
  { token_type, access_token }: Token
) {
  const response = await fetch("https://api.github.com" + path, {
    headers: { Authorization: token_type + " " + access_token },
  });
  const data = await response.json();
  if (response.status !== 200) throw new Error(data.message);
  return data;
}
