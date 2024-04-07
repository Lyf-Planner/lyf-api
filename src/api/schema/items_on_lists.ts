import { DBObject, ID } from "./abstract";
import { ItemDbObject } from "./items";
import { ListDbObject } from "./lists";

// This might need review.. we'll see

export type ItemListRelationshipDbObject = DBObject & {
  item_id: ID;
  item: ItemDbObject;
  list_id: ID;
  list: ListDbObject;
};
