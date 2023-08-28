import { encode } from "../utils";
import type { Methods, Google } from "../types";

export default {
  requestCode({ id, redirect, state }) {
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
  },

  async requestToken({ id, secret, redirect, code }) {
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
    if (response.status !== 200)
      throw new Error("failed to fetch access token");
    return await response.json();
  },

  async requestUser(token) {
    const response = await fetch(
      "https://www.googleapis.com/oauth2/v3/userinfo",
      { headers: { Authorization: token } }
    );
    const data = await response.json();
    if (response.status !== 200) throw new Error(data.message);
    const { given_name, email, picture }: Google = data;
    return { name: given_name, email: email.toLowerCase(), image: picture };
  },
} as Methods;
