import { encode } from "../utils";
import type { Discord, Methods } from "../types";

export default {
  requestCode({ id, state, redirect }) {
    const url = "https://discord.com/oauth2/authorize";
    const params = encode({
      response_type: "code",
      scope: ["identify", "email"],
      client_id: id,
      state: state,
      redirect_uri: redirect,
      prompt: "none",
    });
    return url + "?" + params;
  },

  async requestToken({ id, secret, code, redirect }) {
    const response = await fetch("https://discord.com/api/v10/oauth2/token", {
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
    const response = await fetch("https://discord.com/api/v10/users/@me", {
      headers: { Authorization: token },
    });
    const data = await response.json();
    if (response.status !== 200) throw new Error(data.message);
    const { id, username, email, avatar }: Discord = data;
    return {
      name: username,
      email: email.toLowerCase(),
      image: `https://cdn.discordapp.com/avatars/${id}/${avatar}.png`,
    };
  },
} as Methods;
