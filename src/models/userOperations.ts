import { ID, Time } from "../api/abstract";
import { User, UserDetails } from "../api/user";
import authUtils from "../auth/authUtils";
import db from "../repository/dbAccess";
import { Logger } from "../utils/logging";
import { UserModel } from "./userModel";

export class UserOperations {
  // Builder method
  public static async retrieveForUser(user_id: ID, requestor_id: string) {
    var user = (await db.usersCollection().getById(user_id)) as User;
    if (!user) {
      var logger = Logger.of(UserOperations);
      logger.error(`User ${user_id} does not exist`);
      throw new Error(`User ${user_id} does not exist`);
    }

    return new UserModel(user, true, requestor_id !== user_id);
  }

  // Builder method
  static async createNew(
    user_id: string,
    password: string,
    commit = false // Also create in db
  ): Promise<UserModel> {
    var user = {} as any;
    user.id = user_id;
    user.pass_hash = authUtils.hashPass(password);
    user.timetable = {
      activeTemplate: 0,
      items: [],
    };
    user.notes = [];
    user.premium = { enabled: false };
    user.friends = [];
    user.friend_requests = [];

    var model = new UserModel(user, false, false);
    if (commit) await model.commit(true);

    return model;
  }

  public static async retrieveManyUsers(user_ids: ID[]) {
    var users = (await db.usersCollection().getManyById(user_ids)) as any[];
    users = users.map((x) => UserOperations.extractUserDetails(x));

    return users;
  }

  public static extractUserDetails(user: User): UserDetails {
    // Needs validator
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      pfp_url: user.pfp_url,
      friends: user.friends,
    };
  }

  public static extractSensitiveFields(user: User) {
    return {
      pass_hash: user.pass_hash,
      notification_token_hash: user.notification_token_hash,
      friends: user.friends,
      friend_requests: user.friend_requests,
      premium: user.premium,
    };
  }
}
