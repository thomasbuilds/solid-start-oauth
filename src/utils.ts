export const encode = (params: Record<string, any>) =>
  Object.entries(params)
    .filter(([_, value]) => value)
    .map(([key, value]) =>
      Array.isArray(value)
        ? `${key}=${value.map(encodeURIComponent).join("+")}`
        : `${key}=${encodeURIComponent(value)}`
    )
    .join("&");

export const formatEnv = (env: Env): Record<string, string> =>
  Object.fromEntries(
    Object.entries(env).filter(([_, value]) => typeof value === "string")
  );
