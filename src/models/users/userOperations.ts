import { ID, Time } from "../../api/abstract";
import { User, UserDetails } from "../../api/user";
import { Logger } from "../../utils/logging";
import { UserModel } from "./userModel";
import { ItemOperations } from "../items/ItemOperations";
import { SocialUser } from "../social/socialUser";
import authUtils from "../../auth/authUtils";
import db from "../../repository/dbAccess";

export class UserOperations {
  // Builder method
  public static async retrieveForUser(
    user_id: ID,
    requestor_id: string,
    social: boolean = false
  ): Promise<UserModel | SocialUser> {
    var user = (await db.usersCollection().getById(user_id)) as User;
    const user_undiscoverable = user_id !== requestor_id && user.private;
    if (!user || user_undiscoverable) {
      var logger = Logger.of(UserOperations);
      logger.error(`User ${user_id} does not exist`);
      throw new Error(`User ${user_id} does not exist`);
    }

    if (social) {
      return new SocialUser(user, true, requestor_id === user_id);
    } else {
      return new UserModel(user, true, requestor_id === user_id);
    }
  }

  // Builder method
  static async createNew(
    user_id: string,
    password: string,
    commit = true, // Also create in db
    timezone?: string
  ): Promise<UserModel> {
    let intro_item_id = await ItemOperations.createUserIntroItem(user_id);

    var user = {} as any;
    user.id = user_id;
    user.pass_hash = await authUtils.hashPass(password);
    user.details = {};
    user.timetable = {
      items: [{ id: intro_item_id }],
      invited_items: [],
    };
    user.notes = {
      items: [],
      invited_items: [],
    };
    user.timezone = timezone || process.env.TZ;
    user.premium = {
      enabled: true,
      notifications: {
        daily_notifications: false,
        daily_notification_time: "08:00",
        persistent_daily_notification: false,
        event_notifications_enabled: true,
        event_notification_minutes_before: "5",
      },
    };
    user.social = {
      friends: [],
      requests: [],
      requested: [],
      blocked: [],
    };

    var model = new UserModel(user, false, true);
    if (commit) await model.commit();

    return model;
  }

  public static async getUserPushTokens(user_id: ID) {
    var user = (await db.usersCollection().getById(user_id)) as User;
    return user.expo_tokens || [];
  }

  public static async retrieveManyUsers(user_ids: ID[]) {
    var users = (await db
      .usersCollection()
      .getManyById(user_ids, false)) as any[];
    users = users.map((x) => UserOperations.extractUserDetails(x));

    return users;
  }

  public static extractUserDetails(user: User): UserDetails & Time {
    // Needs validator
    return {
      ...user.details,
      id: user.id,
      last_updated: user.last_updated,
      created: user.created,
    };
  }
}
