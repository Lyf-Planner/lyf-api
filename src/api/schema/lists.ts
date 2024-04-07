import { DBObject } from "./abstract";
import { ItemListRelationshipDbObject } from "./items_on_lists";
import { ListUserRelationshipDbObject } from "./lists_on_users";

export enum ListType {
  ListOnly = "List Only",
  NoteOnly = "Note Only",
  Multiple = "Multiple"
}

export type ListDbObject = DBObject & {
    title: string;
    type: ListType;
    note?: string;
    // Items
    items: ItemListRelationshipDbObject[]
    // Users
    users: ListUserRelationshipDbObject[]
  };



