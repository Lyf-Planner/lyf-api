import { compare, hash } from "bcrypt";
import * as jwt from "jsonwebtoken";
import { User } from "../api/user";
import { saveUser } from "../userOps";
import env from "../envManager";

export async function authenticate(user: User, password: string) {
  if (!user.pass_hash) {
    // Doesn't have account yet, append this as password and save
    var hashed = await hashPass(password);
    user.pass_hash = hashed;
    await saveUser(user);
  } else {
    const res = await compare(password, user.pass_hash);
    if (!res) {
      console.log("Authentication failed");
      return false;
    }
  }

  const token = jwt.sign({ user_id: user.user_id }, env.jwtSecret as any, {
    // Caution: Setting an expiry will only work if we encode an object
    // Don't change it back to a string!
    expiresIn: "1y",
  });
  return token;
}

export function verifyToken(token: string): jwt.JwtPayload {
  return jwt.verify(token as string, env.jwtSecret as any) as any;
}

export async function hashPass(password: string) {
  return await hash(password, 10);
}
