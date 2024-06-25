import { Kysely } from 'kysely';

import { ListItem as MongoItem, ListItemTypes } from '../api/mongo_schema/list';
import { ItemDbObject as PostgresItem, ItemType } from '../api/schema/database/items';
import mongoDb from '../db/mongo/mongo_db';

export async function up(db: Kysely<any>): Promise<void> {
  const itemsCollection = mongoDb.itemsCollection();
  const mongoItems: MongoItem[] = await itemsCollection.findAll();

  for (const item of mongoItems) {
    if (item.template_id) {
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

  // Verify template item exists
  let uploaded_template_id = null;
  if (item.template_id) {
    const template_item = await db
      .selectFrom('items')
      .where('id', '=', item.template_id as any)
      .execute();
    if (template_item.length) {
      uploaded_template_id = item.template_id as any;
    } else {
      console.warn('\tNOT UPLOADING TEMPLATE_ID', item.template_id, 'OF TEMPLATED ITEM', item.id);
    }
  }

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
    template_id: uploaded_template_id,
    url: item.url,
    location: item.location,
    show_in_upcoming: item.show_in_upcoming,
    notification_mins_before: undefined
  };

  await db.insertInto('items').values(pgItem).execute();
};
