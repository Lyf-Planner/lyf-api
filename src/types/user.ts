import { Notes } from "./notes";
import { Timetable } from "./timetable";

export type User = {
  user_id: string;
  pass_hash: string;
  timetable?: Timetable;
  notes?: Notes;
};
