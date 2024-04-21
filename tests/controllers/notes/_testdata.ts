import { NoteType } from '../../../src/api/schema/notes';
import { NoteRelationshipStatus } from '../../../src/api/schema/notes_on_users';

export const testNoteCreation = {
  title: 'test note',
  type: NoteType.Multiple
};

export const testNoteCreatorRelationship = {
  user_id: 'test_user',
  invite_pending: false,
  status: NoteRelationshipStatus.Owner
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
