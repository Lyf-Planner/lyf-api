export type ID = string;

export type DBObject = Identifiable & Time;

export type Identifiable = {
  id: ID;
};

export type Time = {
  created: Date;
  last_updated: Date;
};
