import { Kysely } from 'kysely';

import { Note as MongoNote } from '../../types/mongo_schema/notes';
import { User as MongoUser } from '../../types/mongo_schema/user';
import { Permission } from '../../types/schema/database/items_on_users';
import { NoteUserRelationshipDbObject } from '../../types/schema/database/notes_on_users';
import { UserDbObject } from '../../types/schema/database/user';
import mongoDb from '../mongo/mongo_db';

export async function up(db: Kysely<any>): Promise<void> {
  const usersCollection = mongoDb.usersCollection();
  const mongoUsers: MongoUser[] = await usersCollection.findAll();

  for (const user of mongoUsers) {
    const notes = user.notes.items;
    // Invited items haven't been used yet - no need to account for

    for (const noteIdObject of notes) {
      try {
        const { id } = noteIdObject;
        const note = await mongoDb.notesCollection().getById(id, false);

        if (note) {
          await insertAsPgUserNote(user, note, db);
        }
      } catch {
        continue;
      }
    }
  }
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.deleteFrom('notes_on_users').execute();
}

const insertAsPgUserNote = async (user: MongoUser, note: MongoNote, db: Kysely<any>) => {
  const userNewId = await getUserNewId(user.id, db);
  if (!userNewId) {
    throw new Error('Previous migrations failed to upload users!');
  }

  const pgUserNote: NoteUserRelationshipDbObject = {
    created: new Date(),
    last_updated: new Date(),
    note_id_fk: note.id as any,
    user_id_fk: userNewId as any,
    invite_pending: false,
    permission: Permission.Owner
  };

  await db.insertInto('notes_on_users').values(pgUserNote).execute();
};

const getUserNewId = async (user_id: string, db: Kysely<any>) => {
  const result = await db.selectFrom('users').selectAll().where('id', '=', user_id).execute();
  if (result.length !== 1) {
    console.log('user_id', user_id, 'does not exist anymore!! Ignoring');
    return;
  }

  const pgUser = result[0] as UserDbObject;
  if (!pgUser.id) {
    console.log('Couldnt migrate user', user_id, 'with pg entry', JSON.stringify(pgUser));
    throw new Error('Wtf');
  }

  console.log('got user', user_id, 'new id', pgUser.id);
  return pgUser.id;
};
