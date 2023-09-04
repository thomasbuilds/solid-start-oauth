# OAuth2 for SolidStart

This package returns the `name`, `email` and `image` of user authenticated through third party services (Discord, GitHub, Google, Spotify).

## Installation

```bash
# npm
npm install solid-start-oauth

# pnpm
pnpm add solid-start-oauth
```

## Configuration

Your configuration can either be an object or a function. Use it as a function to have your variables in argument when your environment doesn't support `process.env` or `import.meta.env` (for example with Cloudflare).

```ts
//api/oauth/[...oauth].ts
import OAuth, { type Configuration } from "solid-start-oauth";

const configuration: Configuration = env => ({
  google: {
    id: process.env.GOOGLE_ID as string,
    secret: process.env.GOOGLE_SECRET as string,
    state: process.env.STATE, //optional XSRF protection
  },
  //or
  google: { id: env.GOOGLE_ID, secret: env.GOOGLE_SECRET, state: env.STATE },
  async handler(user, redirect) {
    //use solid-start sessions to store cookie
    const dbUser = await database.getUser("email", user.email);
    if (dbUser) return await signIn(dbUser, redirect);
    return await signUp(user);
  },
});

export const GET = OAuth(configuration);
```

- In case of error, you are redirected to page requesting login and `error` parameter specifies reason.
- Adding a `redirect` search parameter on page requesting login gives you access to the value on handler function.
- Add the path of the catch-all route if it's not directly under `/api` folder when calling `useOAuthLogin`.

```tsx
//login.tsx
export default function Login() {
  const requestLogin = useOAuthLogin("oauth"); //the folder (api/oauth/)

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
