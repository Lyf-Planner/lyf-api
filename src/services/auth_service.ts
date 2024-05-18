import { compare, hash } from 'bcrypt';
import * as jwt from 'jsonwebtoken';

import { User } from '../api/schema/user';
import env from '../envManager';

export class AuthService {
  // Verify password matches user pass_hash, mint token if so
  public async authenticate(user: User, password: string) {
    const res = await compare(password, user.pass_hash);
    if (!res) {
      console.log('Authentication failed');
      return false;
    }

    const token = jwt.sign({ user_id: user.id }, env.jwtSecret as string, {
      // Caution: Setting an expiry will only work if we encode an object
      // Don't change the content (user_id) back to a string!
      expiresIn: '1y'
    });
    return token;
  }

  public verifyToken(token: string): jwt.JwtPayload {
    return jwt.verify(token as string, env.jwtSecret as any) as any;
  }

  public async hashPass(password: string) {
    return await hash(password, 10);
  }
}
