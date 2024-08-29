import { Permission } from '../../../src/types/schema/database/items_on_users';
import { NoteType } from '../../../src/types/schema/database/notes';

export const testNoteCreation = {
  title: 'test note',
  type: NoteType.Multiple
};

export const testNoteCreatorRelationship = {
  user_id: 'test_user',
  invite_pending: false,
  status: Permission.Owner
};

export const testNoteExport = {
  id: expect.any(String),
  created: expect.any(Date),
  last_updated: expect.any(Date),
  title: 'test note',
  type: NoteType.Multiple,
  note: null,
  // Items
  items: [],
  // Users
  users: [testNoteCreatorRelationship]
};
