# OAuth for SolidStart

This package returns the `name`, `email` and `image` of authentificated user through third party services (google, discord, github, spotify).

## Configuration

```ts
//login.ts
export default function OAuth() {
  const requestLogin = useOAuthLogin();

  return (
    <div>
      <a href={requestLogin("oauth/google")}>
        <GoogleIcon />
      </a>
      <a href={requestLogin("oauth/github")}>
        <GithubIcon />
      </a>
    </div>
  );
}
```
```ts
//api/oauth/[...oauth].ts
import OAuth, { type Configuration } from "solid-start-oauth"

const configuration: Configuration = {
  google: {
    id: process.env.GOOGLE_ID as string,
    secret: process.env.GOOGLE_SECRET as string,
    state: process.env.STATE as string, //optional
  },
  github: {
    id: process.env.GITHUB_ID as string,
    secret: process.env.GITHUB_SECRET as string,
    state: process.env.STATE as string,
  },
  async handler(user, redirect) {
    //use solid-start sessions to store cookie
    const dbUser = await database.getUser("email", user.email);
    if (dbUser) return await signIn(dbUser, redirect);
    return await signUp(user);
    ...
  },
};

export const GET = OAuth(configuration);
```

You then use solid-start sessions to authentificate user in your app:

```ts
export async function signUp({ name, email, image }: User) {
  const { id } = await database.createUser({ name: name, email: email, image: image });
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

**Contribution for more providers support is much appreciated**
