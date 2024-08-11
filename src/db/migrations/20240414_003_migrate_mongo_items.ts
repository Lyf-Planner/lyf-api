import { Kysely } from 'kysely';

import { ListItem as MongoItem, ListItemTypes } from '../../api/mongo_schema/list';
import { ItemDbObject as PostgresItem, ItemType } from '../../api/schema/database/items';
import mongoDb from '../mongo/mongo_db';

export async function up(db: Kysely<any>): Promise<void> {
  const itemsCollection = mongoDb.itemsCollection();
  const mongoItems: MongoItem[] = await itemsCollection.findAll();

  for (const item of mongoItems) {
    // Template items are handled in the subsequent migration
    if (!item.template_id) {
      await insertAsPgItem(item, db);
    }
  }
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.deleteFrom('items').execute();
}

const insertAsPgItem = async (item: MongoItem, db: Kysely<any>) => {
  const owner = await mongoDb.usersCollection().getById(item.permitted_users[0].user_id, false);
  const intendedTimezone = owner?.timezone || 'Australia/Melbourne';

  const pgItem: PostgresItem = {
    id: item.id as any,
    created: item.created,
    last_updated: item.last_updated,
    title: item.title,
    collaborative: item.permitted_users.length > 1,
    type: item.type === ListItemTypes.Item ? ItemType.Task : (item.type as any),
    status: item.status,
    tz: intendedTimezone,
    date: item.date, // yyyy-mm-dd
    day: item.day,
    desc: item.desc,
    time: item.time, // hh:mm
    end_time: item.end_time,
    template_id: undefined,
    url: item.url,
    location: item.location,
    default_sorting_rank: undefined,
    default_show_in_upcoming: item.show_in_upcoming,
    default_notification_mins: undefined
  };

  await db.insertInto('items').values(pgItem).execute();
};
