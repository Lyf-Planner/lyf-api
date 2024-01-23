import { body, query } from "express-validator";
import { ID, Permission } from "../../api/abstract";
import { DaysOfWeek } from "../../api/timetable";
import { Note, NoteType } from "../../api/notes";

// GET

export const getNoteValidator = [query("note_id").isString()];

export const deleteNoteValidator = [query("note_id").isString()];

// POST

export const createNoteValidator = [
  // Essentials
  body("id").isString(),
  body("title").isString(),
  body("type").custom((perm) => Object.values(NoteType).includes(perm)),
  body("content").exists(), // This is too hard to validate
  // Social stuff
  body("permitted_users").isArray(),
  body("permitted_users.*.id").isString(),
  body("permitted_users.*.permissions").custom((perm) =>
    Object.values(Permission).includes(perm)
  ),
  body("invited_users").optional().isArray(),
  body("invited_users.*").isString(),
  //   body("suggestions_only").optional().isBoolean(),
  //   body("suggested_changes").optional().isObject(), // This should be of Note type - hard to validate
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

export type createNoteBody = Note;

export const updateNoteValidator = [
  // Essentials
  body("id").isString(),
  body("title").isString(),
  body("type").custom((perm) => Object.values(NoteType).includes(perm)),
  body("content").exists(),
  // Social stuff
  body("permitted_users").isArray(),
  body("permitted_users.*.id").isString(),
  body("permitted_users.*.permissions").custom((perm) =>
    Object.values(Permission).includes(perm)
  ),
  body("invited_users").optional().isArray(),
  body("invited_users.*").isString(),
  //   body("suggestions_only").optional().isBoolean(),
  //   body("suggested_changes").optional().isObject(), // This should be of Note type - hard to validate
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

export type updateNoteBody = Note;

export const getNotesValidator = [
  body("note_ids").isArray(),
  body("note_ids.*").isString(),
];

export type getNotesBody = { note_ids: ID[] };
