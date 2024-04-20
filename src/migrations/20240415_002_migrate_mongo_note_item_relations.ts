import { Kysely } from 'kysely';

import { ListItem as MongoItem } from '../api/mongo_schema/list';
import { Note as MongoNote, NoteType as MongoNoteType } from '../api/mongo_schema/notes';
import { ItemNoteRelationshipDbObject } from '../api/schema/items_on_notes';
import mongoDb from '../repository/db/mongo/mongoDb';

export async function up(db: Kysely<any>): Promise<void> {
  const notesCollection = mongoDb.notesCollection();
  const mongoNotes: MongoNote[] = await notesCollection.findAll();

  for (const note of mongoNotes) {
    // Upload all it's items first
    if (note.type === MongoNoteType.List) {
      for (const item of note.content as MongoItem[]) {
        await insertAsPgItemNoteRelation(item, note.id, db);
      }
    }
  }
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.deleteFrom('items_on_notes').execute();
}

const insertAsPgItemNoteRelation = async (item: MongoItem, note_id: string, db: Kysely<any>) => {
  console.log('Uploading relation between item', item.id, 'and note', note_id);
  const pgItem: ItemNoteRelationshipDbObject = {
    created: item.created,
    last_updated: item.last_updated,
    item_id_fk: item.id as any,
    note_id_fk: note_id as any
  };

  await db.insertInto('items_on_notes').values(pgItem).execute();
};
