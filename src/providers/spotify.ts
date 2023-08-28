import { encode } from "../utils";
import type { Methods, Spotify } from "../types";

export default {
  requestCode({ id, redirect, state }) {
    const url = "https://accounts.spotify.com/authorize";
    const params = encode({
      response_type: "code",
      client_id: id,
      scope: "user-read-email",
      redirect_uri: redirect,
      state: state,
    });
    return url + "?" + params;
  },

  async requestToken({ id, secret, redirect, code }) {
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
    if (response.status !== 200)
      throw new Error("failed to fetch access token");
    return await response.json();
  },

  async requestUser(token) {
    const response = await fetch("https://api.spotify.com/v1/me", {
      headers: { Authorization: token },
    });
    const data = await response.json();
    if (response.status !== 200) throw new Error(data.message);
    const { display_name, email, images }: Spotify = data;
    return {
      name: display_name,
      email: email.toLowerCase(),
      image: images?.[0]?.url,
    };
  },
} as Methods;
