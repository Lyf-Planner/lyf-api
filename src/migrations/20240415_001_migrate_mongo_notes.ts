import { Kysely } from 'kysely';

import { ListItem as MongoItem, ListItemTypes } from '../api/mongo_schema/list';
import { Note as MongoNote, NoteType as MongoNoteType } from '../api/mongo_schema/notes';
import { ItemDbObject as PostgresItem, ItemStatus, ItemType } from '../api/schema/items';
import { NoteDbObject as PostgresNote, NoteType as PgNoteType } from '../api/schema/notes';
import mongoDb from '../repository/db/mongo/mongo_db';

export async function up(db: Kysely<any>): Promise<void> {
  const notesCollection = mongoDb.notesCollection();
  const mongoNotes: MongoNote[] = await notesCollection.findAll();

  for (const note of mongoNotes) {
    // Upload all it's items first
    if (note.type === MongoNoteType.List) {
      for (const item of note.content as MongoItem[]) {
        await insertAsPgItem(item, db);
      }
    }

    await insertAsPgNote(note, db);
  }
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.deleteFrom('notes').execute();
}

const insertAsPgItem = async (item: MongoItem, db: Kysely<any>) => {
  const owner = await mongoDb.usersCollection().getById(item.permitted_users[0].user_id, false);
  const intendedTimezone = owner?.timezone || 'Australia/Melbourne';

  const pgItem: PostgresItem = {
    id: item.id as any,
    created: item.created,
    last_updated: item.last_updated,
    title: item.title,
    type: item.type === ListItemTypes.Item ? ItemType.Task : (item.type as any) || ItemType.Task,
    status: item.status || ItemStatus.Upcoming,
    tz: intendedTimezone,
    date: item.date, // yyyy-mm-dd
    day: item.day,
    desc: item.desc,
    time: item.time, // hh:mm
    end_time: item.end_time,
    template_id: undefined,
    url: item.url,
    location: item.location,
    show_in_upcoming: undefined,
    notification_mins_before: undefined
  };

  await db.insertInto('items').values(pgItem).execute();
};

const insertAsPgNote = async (note: MongoNote, db: Kysely<any>) => {
  const pgNote: PostgresNote = {
    id: note.id as any,
    created: note.created,
    last_updated: note.last_updated,
    title: note.title,
    type: note.type === MongoNoteType.List ? PgNoteType.ListOnly : (PgNoteType.NoteOnly as any),
    content: note.type === MongoNoteType.Text ? (note.content as string) : undefined
  };

  await db.insertInto('notes').values(pgNote).execute();
};
