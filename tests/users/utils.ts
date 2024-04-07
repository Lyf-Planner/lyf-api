import authUtils from "../../src/utils/authUtils";

export const testUserCredentials = {
  user_id: "test_user",
  pass_hash: "",
};

export const testUserPassword = "password";

export const loginAsTestUser = async () => {
  testUserCredentials.pass_hash = await authUtils.hashPass(testUserPassword);

  const token = await authUtils.authenticate(
    testUserCredentials as any,
    testUserPassword
  );

  return token;
};

export const getDefaultRequestHeader = async () => {
  const token = await loginAsTestUser();
  return {
    headers: { Authorization: `Bearer ${token}` },
  };
};
