import { compare, hash } from "bcrypt";
import { Request, Response } from "express";
import * as jwt from "jsonwebtoken";
import { User } from "../api/user";
import { saveUser } from "../userOps";
import env from "../envManager";
import { Logger } from "../utils/logging";

export class AuthUtils {
  private logger = Logger.of(AuthUtils);

  public async authenticate(user: User, password: string) {
    if (!user.pass_hash) {
      // Doesn't have account yet, append this as password and save
      var hashed = await this.hashPass(password);
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

  public verifyToken(token: string): jwt.JwtPayload {
    return jwt.verify(token as string, env.jwtSecret as any) as any;
  }

  public async hashPass(password: string) {
    return await hash(password, 10);
  }

  public authoriseHeader(req: Request, res: Response) {
    try {
      var token = req.headers["token"] as string;
      var { user_id } = this.verifyToken(token);
      return user_id;
    } catch (err) {
      let message = "Unauthorised token in request header";
      this.logger.warn(message);
      res.status(401).end(message);
    }
  }
}

const authUtils = new AuthUtils();

export default authUtils;
