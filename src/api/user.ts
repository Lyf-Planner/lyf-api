import { ID } from "./abstract";
import { Notes } from "./notes";
import { Premium } from "./premium";
import { Timetable } from "./timetable";

export type User = {
  user_id: string;
  pass_hash: string;
  notification_token_hash?: string;
  details?: UserDetails;
  timetable?: Timetable;
  notes?: Notes[];
  premium?: Premium;
};

export type UserDetails = {
  user_id: string;
  name?: string;
  email?: string;
  pfp_url?: string;
  friends?: UserDetails[];
};
