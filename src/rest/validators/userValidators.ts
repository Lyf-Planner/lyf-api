import { body, query } from "express-validator";
import { isValidTimeZone } from "./utils";
import assert from "assert";
import { ID } from "../../api/abstract";
import { Timetable } from "../../api/timetable";
import { Notes } from "../../api/notes";
import { Premium } from "../../api/premium";

// GET

export const loginValidator = [
  query("user_id", "User ID cannot be empty!").not().isEmpty(),
  query("password", "Password cannot be empty!").not().isEmpty(),
];

export const autologinValidator = [query("*").isEmpty()];

export const getUserValidator = [
  query("user_id", "User ID cannot be empty").not().isEmpty(),
];

// POST

export const getUsersValidator = [
  body("user_ids", "User IDs field must be a non-empty array!").isArray({
    min: 1,
  }),
];

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
    .optional()
    .custom((tz) => tz && isValidTimeZone(tz)),
];

export type createUsersBody = {
  user_id: ID;
  password: string;
  timezone?: string;
};

export const updateMeValidator = [
  body("name").optional().isString(),
  body("email").optional().isString(),
  body(
    "timezone",
    "Invalid timezone provided. Must be an IANA timezone identifier (e.g. Australia/Melbourne)"
  )
    .optional()
    .custom((tz) => tz && isValidTimeZone(tz)),
  // Premium stuff
  body("premium").optional().isObject(),
  body("premium.enabled").optional().isBoolean(),
  body("premium.notifications").optional().isObject(),
  body("premium.notifications.daily_notifications").optional().isBoolean(),
  body("premium.notifications.daily_notification_time")
    .optional()
    .isTime({ hourFormat: "hour24" }),
  body("premium.notifications.persistent_daily_notification")
    .optional()
    .isBoolean(),
  body("premium.notifications.event_notifications_enabled")
    .optional()
    .isBoolean(),
  body("premium.notifications.event_notification_minutes_before")
    .optional()
    .isNumeric(),
  // Timetable stuff
  body("timetable").isObject(),
  body("timetable.first_day").optional().isDate({ format: "YYYY-MM-DD" }),
  body("timetable.items").isArray(),
  body("timetable.items.*.id").isString().notEmpty(),
  body("timetable.items.*.show_in_upcoming").optional().isBoolean(),
  // Notes stuff
  body("notes").isObject(),
  body("notes.items").isArray(),
  body("notes.items.*.id").isString().notEmpty(),
];

export type updateMeBody = {
  name?: string;
  email?: string;
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
