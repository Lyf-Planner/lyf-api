// import { Kysely } from 'kysely';

// import { Note as MongoNote } from '../../types/mongo_schema/notes';
// import { User as MongoUser } from '../../types/mongo_schema/user';
// import { Permission } from '../../types/schema/database/items_on_users';
// import { NoteUserRelationshipDbObject } from '../../types/schema/database/notes_on_users';
// import { UserDbObject } from '../../types/schema/database/user';
// import mongoDb from '../mongo/mongo_db';

// export async function up(db: Kysely<any>): Promise<void> {
//   const usersCollection = mongoDb.usersCollection();
//   const mongoUsers: MongoUser[] = await usersCollection.findAll();

//   for (const user of mongoUsers) {
//     const notes = user.notes.items;
//     // Invited items haven't been used yet - no need to account for

//     for (const noteIdObject of notes) {
//       try {
//         const { id } = noteIdObject;
//         const note = await mongoDb.notesCollection().getById(id, false);

//         if (note) {
//           await insertAsPgUserNote(user, note, db);
//         }
//       } catch {
//         continue;
//       }
//     }
//   }
// }

// export async function down(db: Kysely<any>): Promise<void> {
//   // await db.deleteFrom('notes_on_users').execute();
// }

// const insertAsPgUserNote = async (user: MongoUser, note: MongoNote, db: Kysely<any>) => {
//   const userNewId = user.id;
//   if (!userNewId) {
//     throw new Error('Previous migrations failed to upload users!');
//   }

//   const pgUserNote: NoteUserRelationshipDbObject = {
//     created: new Date(),
//     last_updated: new Date(),
//     note_id_fk: note.id as any,
//     user_id_fk: userNewId as any,
//     invite_pending: false,
//     permission: Permission.Owner
//   };

//   console.log("Inserting note-user relationship", note.id, user.id);
//   await db.insertInto('notes_on_users').values(pgUserNote).execute();
// };
