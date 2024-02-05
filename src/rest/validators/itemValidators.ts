import { body, query } from "express-validator";
import { ID } from "../../api/abstract";
import { Permission } from "../../api/social";
import { ItemStatus, ListItem, ListItemTypes } from "../../api/list";
import { DaysOfWeek } from "../../api/timetable";

// GET

export const getItemValidator = [query("item_id").isString()];

export const deleteItemValidator = [query("item_id").isString()];

// POST

export const createItemValidator = [
  // Essentials
  body("id").isString(),
  body("template_id").isString().optional({ nullable: true }),
  body("title").isString(),
  body("type").custom((perm) => Object.values(ListItemTypes).includes(perm)),
  body("status").custom((status) => Object.values(ItemStatus).includes(status)),
  // Item extra details
  body("date").isDate({ format: "YYYY-MM-DD" }).optional({ nullable: true }),
  body("day")
    .custom((status) => Object.values(DaysOfWeek).includes(status))
    .optional({ nullable: true }),
  body("time").isTime({ hourFormat: "hour24" }).optional({ nullable: true }),
  body("desc").isString().optional({ nullable: true }),
  // Notifications
  body("notifications").isArray().optional({ nullable: true }),
  body("notifications.*.user_id").isString(),
  body("notifications.*.minutes_before").isString(),
  // Social stuff
  body("permitted_users").isArray(),
  body("permitted_users.*.user_id").isString(),
  body("permitted_users.*.permissions").custom((perm) =>
    Object.values(Permission).includes(perm)
  ),
  body("invited_users").isArray().optional({ nullable: true }),
  body("invited_users.*").isString(),
  body("suggestions_only").isBoolean().optional({ nullable: true }),
  body("suggested_changes").isObject().optional({ nullable: true }), // This should be of Item type - hard to validate
  body("suggested_changes.*.user_id").isString(),
  body("suggested_changes.*.vote").isInt(),
  body("suggested_changes.*.approved_by").isArray(),
  body("suggested_changes.*.approved_by.*").isString(),
  body("suggested_changes.*.dismissed_by").isArray(),
  body("suggested_changes.*.dismissed_by.*").isString(),
  body("comments").isArray().optional({ nullable: true }),
  body("comments.**.user_id").isString(),
  body("comments.**.text").isString(),
  body("comments.**.replies").isArray(),
];

export type createItemBody = ListItem;

export const updateItemValidator = [
  // Essentials
  body("id").isString(),
  body("template_id").isString().optional(),
  body("title").isString().optional(),
  body("type")
    .custom((perm) => Object.values(ListItemTypes).includes(perm))
    .optional(),
  body("status")
    .custom((status) => Object.values(ItemStatus).includes(status))
    .optional(),
  // Item extra details
  body("date").isDate({ format: "YYYY-MM-DD" }).optional({ nullable: true }),
  body("day")
    .custom((status) => Object.values(DaysOfWeek).includes(status))
    .optional({ nullable: true }),
  body("time").isTime({ hourFormat: "hour24" }).optional({ nullable: true }),
  body("desc").isString().optional({ nullable: true }),
  // Notifications
  body("notifications").isArray().optional({ nullable: true }),
  body("notifications.*.user_id").isString(),
  body("notifications.*.minutes_before").isString(),
  // Social stuff
  body("permitted_users").isArray(),
  body("permitted_users.*.user_id").isString(),
  body("permitted_users.*.permissions").custom((perm) =>
    Object.values(Permission).includes(perm)
  ),
  body("invited_users").isArray().optional({ nullable: true }),
  body("invited_users.*").isString(),
  //   body("suggestions_only").optional({ nullable: true }).isBoolean(),
  //   body("suggested_changes").optional({ nullable: true }).isObject(), // This should be of Item type - hard to validate
  //   body("suggested_changes.*.user_id").isString(),
  //   body("suggested_changes.*.vote").isInt(),
  //   body("suggested_changes.*.approved_by").isArray(),
  //   body("suggested_changes.*.approved_by.*").isString(),
  //   body("suggested_changes.*.dismissed_by").isArray(),
  //   body("suggested_changes.*.dismissed_by.*").isString(),
  //   body("comments").optional({ nullable: true }).isArray(),
  //   body("comments.**.user_id").isString(),
  //   body("comments.**.text").isString(),
  //   body("comments.**.replies").isArray(),
];

export type updateItemBody = ListItem;

export const getItemsValidator = [
  body("item_ids").isArray(),
  body("item_ids.*").isString(),
];

export type getItemsBody = { item_ids: ID[] };

export const inviteUserValidator = [
  body("item_id").isString(),
  body("user_id").isString(),
];

export type inviteUserBody = { item_id: string; user_id: string };

export const addressItemInviteValidator = [
  body("item_id").isString(),
  body("accepted_invite").isBoolean(),
];

export type addressItemInviteBody = {
  item_id: string;
  accepted_invite: boolean;
};
