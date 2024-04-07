// IDs are numbers from postgres autoincrement
export type ID = number;

export type DBObject = Identifiable & Timestamps;

export type Identifiable = {
  id: ID;
};

export type Timestamps = {
  created: Date;
  last_updated: Date;
};
