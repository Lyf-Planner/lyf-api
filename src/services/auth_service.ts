import { compare, hash } from 'bcrypt';
import * as jwt from 'jsonwebtoken';

import env from '../envManager';
import { UserEntity } from '../models/entity/user_entity';
import { LyfError } from '../utils/lyf_error';
import { UserService } from './entity/user_service';

export class AuthService {
  static async loginUser(user_id: string, password: string, include?: string) {
    const userService = new UserService();
    const user = await userService.getEntity(user_id, include);

    const token = await AuthService.authenticateWithUser(user, password);

    return {
      token,
      user: await user.export()
    };
  }

  static async register(user_id: string, password: string, tz: string) {
    const userService = new UserService();

    const passHash = await AuthService.hashPass(password);
    const token = await AuthService.authenticate(user_id, password, passHash);

    const user = await userService.processCreation(user_id, passHash, tz);

    return {
      token,
      user
    };
  }

    // Verify password matches user pass_hash, mint token if so
    static async authenticate(user_id: string, password: string, pass_hash: string) {
      const res = await compare(password, pass_hash);
      if (!res) {
        throw new LyfError(`User ${user_id} provided an incorrect password`, 401);
      }

      const token = jwt.sign({ user_id }, env.jwtSecret as any, {
        // Caution: Setting an expiry will only work if we encode an object
        // Don't change the content (user_id) back to a string!
        expiresIn: '1y'
      });
      return token;
    }

  static async authenticateWithUser(user: UserEntity, password: string) {
    const user_id = user.id();
    const pass_hash = user.getSensitive(user.id()).pass_hash;

    return await AuthService.authenticate(user_id, password, pass_hash);
  }

  static verifyToken(token: string): jwt.JwtPayload {
    return jwt.verify(token as string, env.jwtSecret as any) as any;
  }

  static async hashPass(password: string) {
    return await hash(password, 10);
  }
}
