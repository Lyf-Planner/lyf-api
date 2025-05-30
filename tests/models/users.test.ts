import { ItemEntity } from '../../src/models/entity/item_entity';
import { UserEntity } from '../../src/models/entity/user_entity';
import { ItemUserRelation } from '../../src/models/relation/item_related_user';
import { UserItemRelation } from '../../src/models/relation/user_related_item';
import { createItem1Relation, createTestItem1, createTestUser, item1_id } from './data';

describe('user model tests', () => {
  let user: UserEntity;
  let item: ItemEntity;
  let itemRelation: UserItemRelation;

  // beforeAll(async () => {
  //   // Setup suite context data
  //   user = new UserEntity('test');
  //   const initialData = await createTestUser();
  //   await user.create(initialData, UserEntity.filter);

  //   item = new ItemEntity(item1_id);
  //   const initialItem = createTestItem1();
  //   await item.create(initialItem, ItemEntity.filter);

  //   itemRelation = new UserItemRelation('test', item1_id);
  //   const initialRelation = createItem1Relation();
  //   itemRelation.create(initialRelation, UserItemRelation.filter);
  // });

  afterAll(async () => {
    // Cleanup
    await itemRelation.delete();
    await user.delete();
    await item.delete();
  });

  it('loads relations correctly', async () => {
    await user.fetchRelations();
    await user.load();
  });

  it('exports correctly, with relations', async () => {
    console.log(await user.export());
  });
});
