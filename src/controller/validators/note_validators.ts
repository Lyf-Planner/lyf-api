import { body, query } from 'express-validator';

import { ID } from '../../api/schema/database/abstract';
import { Permission } from '../../api/schema/database/items_on_users';
import { NoteType } from '../../api/schema/database/notes';
import { Note } from '../../api/schema/notes';

// GET

export const getNoteValidator = [query('note_id').isString()];

export const deleteNoteValidator = [query('note_id').isString()];

// POST

export const createNoteValidator = [
  // Essentials
  body('id').isString(),
  body('title').isString(),
  body('type').custom((perm) => Object.values(NoteType).includes(perm)),
  body('content').exists(), // This is too hard to validate
  // Social stuff
  body('permitted_users').isArray(),
  body('permitted_users.*.user_id').isString(),
  body('permitted_users.*.permissions').custom((perm) =>
    Object.values(Permission).includes(perm)
  ),
  body('invited_users').isArray().optional({ nullable: true }),
  body('invited_users.*').isString()
  //   body("suggestions_only").optional({ nullable: true }).isBoolean(),
  //   body("suggested_changes").optional({ nullable: true }).isObject(), // This should be of Note type - hard to validate
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

export type createNoteBody = Note;

export const updateNoteValidator = [
  // Essentials
  body('id').isString(),
  body('title').isString().optional(),
  body('content').exists().optional()
  //   body("suggestions_only").optional({ nullable: true }).isBoolean(),
  //   body("suggested_changes").optional({ nullable: true }).isObject(), // This should be of Note type - hard to validate
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

export type updateNoteBody = Note;

export const getNotesValidator = [
  body('note_ids').isArray(),
  body('note_ids.*').isString()
];

export type getNotesBody = { note_ids: ID[] };
