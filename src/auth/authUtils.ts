import { compare, hash } from "bcrypt";
import { Request, Response } from "express";
import * as jwt from "jsonwebtoken";
import { User } from "../api/user";
import env from "../envManager";
import { Logger } from "../utils/logging";
import assert from "assert";

export class AuthUtils {
  private logger = Logger.of(AuthUtils);

  public async authenticate(user: User, password: string) {
    const res = await compare(password, user.pass_hash);
    if (!res) {
      console.log("Authentication failed");
      return false;
    }

    const token = jwt.sign({ user_id: user.id }, env.jwtSecret as any, {
      // Caution: Setting an expiry will only work if we encode an object
      // Don't change it back to a string!
      expiresIn: "1y",
    });
    return token;
  }

  public verifyToken(token: string): jwt.JwtPayload {
    return jwt.verify(token as string, env.jwtSecret as any) as any;
  }

  public async hashPass(password: string) {
    return await hash(password, 10);
  }

  public authoriseHeader(req: Request, res: Response) {
    try {
      var header = req.headers["Authorization"] as string;
      var token;
      if (header.startsWith("Bearer ")) {
        token = header.substring(7, header.length);
      } else {
        throw new Error("Invalid Authorization header");
      }

      var { user_id, exp } = this.verifyToken(token);
      assert(exp! > Math.floor(new Date().getTime() / 1000));
      return user_id;
    } catch (err) {
      let message = "Unauthorised or expired token in request header";
      this.logger.warn(message);
      res.status(401).end(message);
    }
  }
}

const authUtils = new AuthUtils();

export default authUtils;
