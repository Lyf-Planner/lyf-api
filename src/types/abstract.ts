export type List = ListItem[];

export type ListItem = {
  title: string;
  content: string;
  type?: ListItemTypes;
};

export enum ListItemTypes {
  Event = "Event",
  Task = "Task",
  Item = "Item",
}
