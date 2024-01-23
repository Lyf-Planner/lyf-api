import { body, query } from "express-validator";
import { ID, Permission } from "../../api/abstract";
import { ItemStatus, ListItem, ListItemTypes } from "../../api/list";
import { DaysOfWeek } from "../../api/timetable";

// GET

export const getItemValidator = [query("item_id").isString()];

export const deleteItemValidator = [query("item_id").isString()]

// POST

export const createItemValidator = [
  // Essentials
  body("id").isString(),
  body("template_id").optional().isString(),
  body("title").isString(),
  body("type").custom((perm) => Object.values(ListItemTypes).includes(perm)),
  body("status").custom((status) => Object.values(ItemStatus).includes(status)),
  // Item extra details
  body("date").optional().isDate({ format: "YYYY-MM-DD" }),
  body("day")
    .optional()
    .custom((status) => Object.values(DaysOfWeek).includes(status)),
  body("time").optional().isTime({ hourFormat: "hour24" }),
  body("desc").optional().isString(),
  // Notifications
  body("notifications").optional().isArray(),
  body("notifications.*.user_id").isString(),
  body("notifications.*.minutes_before").isString(),
  // Social stuff
  body("permitted_users").isArray(),
  body("permitted_users.*.id").isString(),
  body("permitted_users.*.permissions").custom((perm) =>
    Object.values(Permission).includes(perm)
  ),
  body("invited_users").optional().isArray(),
  body("invited_users.*").isString(),
  body("suggestions_only").optional().isBoolean(),
  body("suggested_changes").optional().isObject(), // This should be of Item type - hard to validate
  body("suggested_changes.*.user_id").isString(),
  body("suggested_changes.*.vote").isInt(),
  body("suggested_changes.*.approved_by").isArray(),
  body("suggested_changes.*.approved_by.*").isString(),
  body("suggested_changes.*.dismissed_by").isArray(),
  body("suggested_changes.*.dismissed_by.*").isString(),
  body("comments").optional().isArray(),
  body("comments.**.user_id").isString(),
  body("comments.**.text").isString(),
  body("comments.**.replies").isArray(),
];

export type createItemBody = ListItem;

export const updateItemValidator = [
  // Essentials
  body("id").isString(),
  body("title").isString(),
  body("type").custom((perm) => Object.values(ListItemTypes).includes(perm)),
  body("status").custom((status) => Object.values(ItemStatus).includes(status)),
  // Item extra details
  body("date").optional().isDate({ format: "YYYY-MM-DD" }),
  body("day")
    .optional()
    .custom((status) => Object.values(DaysOfWeek).includes(status)),
  body("time").optional().isTime({ hourFormat: "hour24" }),
  body("desc").optional().isString(),
  // Notifications
  body("notifications").optional().isArray(),
  body("notifications.*.user_id").isString(),
  body("notifications.*.minutes_before").isString(),
  // Social stuff
  body("permitted_users").isArray(),
  body("permitted_users.*.id").isString(),
  body("permitted_users.*.permissions").custom((perm) =>
    Object.values(Permission).includes(perm)
  ),
  body("invited_users").optional().isArray(),
  body("invited_users.*").isString(),
  //   body("suggestions_only").optional().isBoolean(),
  //   body("suggested_changes").optional().isObject(), // This should be of Item type - hard to validate
  //   body("suggested_changes.*.user_id").isString(),
  //   body("suggested_changes.*.vote").isInt(),
  //   body("suggested_changes.*.approved_by").isArray(),
  //   body("suggested_changes.*.approved_by.*").isString(),
  //   body("suggested_changes.*.dismissed_by").isArray(),
  //   body("suggested_changes.*.dismissed_by.*").isString(),
  //   body("comments").optional().isArray(),
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