export type Nullified<T> = {
  [K in keyof T]: null;
};