import { ObjectId } from "mongodb";
import { ID, Identifiable, Time } from "./abstract";
import { Notes } from "./notes";
import { Premium } from "./premium";
import { Timetable } from "./timetable";

// Instead of using Identifiable, we use user_id as id
export type User = UserDetails &
  Time &
  Identifiable & {
    pass_hash: string;
    timezone?: string;
    expo_tokens?: string[];
    timetable?: Timetable;
    notes?: Notes[];
    premium?: Premium;
  };

export type UserDetails = {
  id: ID;
  name?: string;
  email?: string;
  pfp_url?: string;
  friends?: ID[];
  friend_requests?: ID[];
};
