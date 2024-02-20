import { body, query } from "express-validator";
import { isValidTimeZone } from "./utils";
import { ID } from "../../api/abstract";
import { Timetable } from "../../api/timetable";
import { Notes } from "../../api/notes";
import { Premium } from "../../api/premium";
import { UserDetails } from "../../api/user";
import { FriendshipAction, FriendshipUpdate } from "../../api/social";
import Expo from "expo-server-sdk";

// GET

export const loginValidator = [
  query("user_id", "User ID cannot be empty!").not().isEmpty(),
  query("password", "Password cannot be empty!").not().isEmpty(),
];

export type loginQuery = { user_id: string; password: string };

export const autologinValidator = [query("*").isEmpty()];

export const getUserValidator = [
  query("user_id", "User ID cannot be empty").not().isEmpty(),
];

export type getUserQuery = { user_id: string };

// POST

export const getUsersValidator = [body("user_ids").isArray()];

export type getUsersBody = {
  user_ids: ID[];
};

export const creationValidator = [
  body("user_id", "Username cannot be empty!").isString().not().isEmpty(),
  body("password", "Password cannot be empty!").isString().not().isEmpty(),
  body(
    "timezone",
    "Invalid timezone provided. Must be an IANA timezone identifier (e.g. Australia/Melbourne)"
  )
    .optional({ nullable: true })
    .custom((tz) => tz && isValidTimeZone(tz)),
];

export type createUsersBody = {
  user_id: ID;
  password: string;
  timezone?: string;
};

export const updateMeValidator = [
  body("details.name").isString().optional({ nullable: true }),
  body("details.email").isEmail().optional({ nullable: true }),
  body(
    "timezone",
    "Invalid timezone provided. Must be an IANA timezone identifier (e.g. Australia/Melbourne)"
  )
    .custom((tz) => tz && isValidTimeZone(tz))
    .optional({ nullable: true }),
  body("expo_tokens").isArray().optional(),
  body("expo_tokens.*").custom((token) => Expo.isExpoPushToken(token)),
  // Premium stuff
  body("premium").isObject().optional({ nullable: true }),
  body("premium.enabled").isBoolean().optional({ nullable: true }),
  body("premium.notifications").isObject().optional({ nullable: true }),
  body("premium.notifications.daily_notifications")
    .isBoolean()
    .optional({ nullable: true }),
  body("premium.notifications.daily_notification_time")
    .isTime({ hourFormat: "hour24" })
    .optional({ nullable: true }),
  body("premium.notifications.persistent_daily_notification")
    .isBoolean()
    .optional({ nullable: true }),
  body("premium.notifications.event_notifications_enabled")
    .isBoolean()
    .optional({ nullable: true }),
  body("premium.notifications.event_notification_minutes_before")
    .isNumeric()
    .optional({ nullable: true }),
  // Timetable stuff
  body("timetable").isObject(),
  body("timetable.first_day")
    .isDate({ format: "YYYY-MM-DD" })
    .optional({ nullable: true }),
  body("timetable.items").isArray(),
  body("timetable.items.*.id").isString().notEmpty(),
  body("timetable.items.*.show_in_upcoming")
    .isBoolean()
    .optional({ nullable: true }),
  // Notes stuff
  body("notes").isObject(),
  body("notes.items").isArray(),
  body("notes.items.*.id").isString().notEmpty(),
];

export type updateMeBody = {
  details?: UserDetails;
  expo_tokens?: string[];
  timezone?: string;
  premium?: Premium;
  timetable: Timetable;
  notes: Notes;
};

export const deleteMeValidator = [
  body("password", "Password cannot be empty!").isString().not().isEmpty(),
];

export type deleteMeBody = {
  password: string;
};

export const updateFriendshipValidator = [
  body("user_id").isString(),
  body("action").custom((perm) =>
    Object.values(FriendshipAction).includes(perm)
  ),
];

export type updateFriendshipBody = FriendshipUpdate;
