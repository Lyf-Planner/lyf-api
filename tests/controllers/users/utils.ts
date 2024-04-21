import authUtils from '../../../src/utils/authUtils';
import { testUser } from './_testdata';

export const authoriseTestUser = async () => {
  testUser.pass_hash = await authUtils.hashPass(testUser.password);

  const token = await authUtils.authenticate(testUser as any, testUser.password);

  return `Bearer ${token}` || '';
};
