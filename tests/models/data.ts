import { v4 as uuid } from 'uuid';

import { ItemDbObject, ItemStatus, ItemType } from '../../src/api/schema/database/items';
import { ItemUserRelationshipDbObject, Permission } from '../../src/api/schema/database/items_on_users';
import { UserDbObject } from '../../src/api/schema/database/user';
import { AuthService } from '../../src/services/auth_service';

export const createTestUser = async (): Promise<UserDbObject> => {
  const creationTime = new Date();

  const user: UserDbObject = {
    id: 'test',
    tz: 'Australia/Melbourne',
    created: creationTime,
    last_updated: creationTime,
    private: false,
    pass_hash: await AuthService.hashPass('password'),
    expo_tokens: []
  };

  return user;
};

export const item1_id = uuid();
export const createTestItem1 = (): ItemDbObject => {
  const creationTime = new Date();

  return {
    id: item1_id,
    created: creationTime,
    last_updated: creationTime,
    title: 'Test Event',
    type: ItemType.Event,
    status: ItemStatus.Upcoming,
    tz: 'Australia/Melbourne'
  };
};

export const createItem1Relation = (): ItemUserRelationshipDbObject => {
  const creationTime = new Date();

  return {
    user_id_fk: 'test',
    item_id_fk: item1_id,
    created: creationTime,
    last_updated: creationTime,
    invite_pending: false,
    permission: Permission.Owner,
    sorting_rank: 0
  };
};
