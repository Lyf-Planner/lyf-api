import { ID } from "./abstract";
import { ItemDbObject } from "./items";
import { ListDbObject } from "./lists";

export type ItemListRelationshipDbObject = {
  item_id: ID;
  item: ItemDbObject;
  list_id: ID;
  list: ListDbObject;
};
