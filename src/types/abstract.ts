export type List = ListItem[];

export type ListItem = {
  title: string;
  content: string;
  desc?: string;
  time?: string;
  notify?: boolean;
  minutes_before?: string;
  type?: ListItemTypes;
};

export enum ListItemTypes {
  Event = "Event",
  Task = "Task",
  Item = "Item",
}
