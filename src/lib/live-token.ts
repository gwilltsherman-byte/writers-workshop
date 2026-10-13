import jwt from "jsonwebtoken";

export type LiveIdentity = { id: string; name: string };
function secret() {
  const value = process.env.AUTH_SECRET;
  if (!value) throw new Error("Set AUTH_SECRET before starting the app.");
  return value;
}
export function signLiveToken(identity: LiveIdentity) {
  return jwt.sign(identity, secret(), {
    audience: "workshop-live",
    expiresIn: "1d",
  });
}
export function readLiveToken(token: unknown): LiveIdentity | null {
  if (typeof token !== "string") return null;
  try {
    const p = jwt.verify(token, secret(), {
      audience: "workshop-live",
      algorithms: ["HS256"],
    }) as jwt.JwtPayload;
    return typeof p.id === "string" && typeof p.name === "string"
      ? { id: p.id, name: p.name }
      : null;
  } catch {
    return null;
  }
}
