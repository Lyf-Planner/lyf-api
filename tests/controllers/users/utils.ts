import { AuthService } from '../../../src/services/auth_service';
import { testUser } from './_testdata';

export const authoriseTestUser = async () => {
  testUser.pass_hash = await AuthService.hashPass(testUser.password);

  const token = await AuthService.authenticate(testUser as any, testUser.password, testUser.pass_hash);

  return `Bearer ${token}` || '';
};
