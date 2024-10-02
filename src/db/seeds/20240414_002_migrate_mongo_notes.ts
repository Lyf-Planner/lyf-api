// import { Kysely } from 'kysely';

// import { ListItem as MongoItem, ListItemTypes } from '../../types/mongo_schema/list';
// import { Note as MongoNote, NoteType as MongoNoteType } from '../../types/mongo_schema/notes';
// import { ItemDbObject as PostgresItem, ItemStatus, ItemType } from '../../types/schema/database/items';
// import { NoteDbObject as PostgresNote, NoteType as PgNoteType } from '../../types/schema/database/notes';
// import mongoDb from '../mongo/mongo_db';

// export async function up(db: Kysely<any>): Promise<void> {
//   const notesCollection = mongoDb.notesCollection();
//   const mongoNotes: MongoNote[] = await notesCollection.findAll();

//   for (const note of mongoNotes) {
//     await insertAsPgNote(note, db);

//     // Upload all it's items first
//     if (note.type === MongoNoteType.List) {
//       let i = 0;
//       for (const item of note.content as MongoItem[]) {
//         await insertAsPgItem(item, note.id, i, db);
//         i++;
//       }
//     }
//   }
// }

// export async function down(db: Kysely<any>): Promise<void> {
//   // await db.deleteFrom('items').execute();
//   // await db.deleteFrom('notes').execute();
// }

// const insertAsPgItem = async (item: MongoItem, note_id: string, rank: number, db: Kysely<any>) => {
//   const owner = await mongoDb.usersCollection().getById(item.permitted_users[0].user_id, false);
//   const intendedTimezone = owner?.timezone || 'Australia/Melbourne';

//   const pgItem: PostgresItem = {
//     id: item.id as any,
//     created: item.created,
//     last_updated: item.last_updated,
//     collaborative: false,
//     title: item.title,
//     type: item.type === ListItemTypes.Item ? ItemType.Task : (item.type as any) || ItemType.Task,
//     status: item.status || ItemStatus.Upcoming,
//     tz: intendedTimezone,
//     date: item.date, // yyyy-mm-dd
//     day: item.day,
//     desc: item.desc,
//     time: item.time, // hh:mm
//     end_time: item.end_time,
//     note_id: note_id,
//     template_id: undefined,
//     url: item.url,
//     location: item.location,
//     default_sorting_rank: rank,
//     default_show_in_upcoming: undefined,
//     default_notification_mins: undefined
//   };

//   console.log("Inserting item", item.id);
//   await db.insertInto('items').values(pgItem).execute();
// };

// const insertAsPgNote = async (note: MongoNote, db: Kysely<any>) => {
//   const pgNote: PostgresNote = {
//     id: note.id as any,
//     created: note.created,
//     last_updated: note.last_updated,
//     title: note.title,
//     type: note.type === MongoNoteType.List ? PgNoteType.ListOnly : (PgNoteType.NoteOnly as any),
//     collaborative: false,
//     content: note.type === MongoNoteType.Text ? (note.content as string) : undefined
//   };

//   console.log("Inserting note", note.id);
//   await db.insertInto('notes').values(pgNote).execute();
// };
