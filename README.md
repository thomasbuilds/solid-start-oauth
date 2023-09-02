# OAuth2 for SolidStart

This package returns the `name`, `email` and `image` of user authenticated through third party services (for now: Google, Discord, GitHub, Spotify).

## Installation

```bash
# npm
npm install solid-start-oauth

# pnpm
pnpm add solid-start-oauth
```

## Configuration

Your configuration can either be an object or a function. Use it as a function to have your variables injected in argument when your environment doesn’t support NodeJS (with Cloudflare for example).

```ts
//api/oauth/[...oauth].ts
import OAuth, { type Configuration } from "solid-start-oauth";

const configuration: Configuration = env => ({
  google: {
    id: process.env.GOOGLE_ID as string, //process for NodeJS
    secret: process.env.GOOGLE_SECRET as string,
    state: process.env.STATE as string, //optional
  },
  github: {
    id: env.GITHUB_ID as string, //for Cloudflare
    secret: env.GITHUB_SECRET as string,
    state: env.STATE as string,
  },
  async handler(user, redirect) {
    //use solid-start sessions to store cookie
    const dbUser = await database.getUser("email", user.email);
    if (dbUser) return await signIn(dbUser, redirect);
    return await signUp(user);
  },
});

export const GET = OAuth(configuration);
```

- Add the path of the catch-all route if it's not directly under `/api` folder when calling `useOAuthLogin`.
- In case of error, you are redirected to page requesting login and `error` parameter specifies reason.
- Adding a `redirect` search parameter on page requesting login gives you access to the value as argument on handler function.

```tsx
//login.ts
export default function Login() {
  const requestLogin = useOAuthLogin("oauth");

  return (
    <div>
      <a href={requestLogin("google")}>
        <GoogleIcon />
      </a>
      <a href={requestLogin("github")}>
        <GithubIcon />
      </a>
    </div>
  );
}
```

The package doesn’t provide the actual authentication for your app. This provides you complete control over redirections and you can seamlessly integrate multiple authentication methods sharing the same logic.

```ts
export async function signUp({ name, email, image }: User) {
  const { id } = await database.createUser({
    name: name,
    email: email,
    image: image,
  });
  const session = await storage.getSession();
  session.set("id", id);
  return redirect("/account", {
    headers: { "Set-Cookie": await storage.commitSession(session) },
  });
}

export async function signIn({ id }: { id: string }, redirectTo?: string) {
  const session = await storage.getSession();
  session.set("id", id);
  return redirect(redirectTo || "/account", {
    headers: { "Set-Cookie": await storage.commitSession(session) },
  });
}
```

## Contributions

Please open issues for bugs and we much appreciate contributions regarding more provider support.
