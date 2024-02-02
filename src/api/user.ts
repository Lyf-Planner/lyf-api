import { ID, Identifiable, Time } from "./abstract";
import { Notes } from "./notes";
import { Premium } from "./premium";
import { Timetable } from "./timetable";

// Instead of using Identifiable, we use user_id as id
export type User = UserDetails &
  Time &
  Identifiable & {
    pass_hash: string;
    timetable: Timetable;
    notes: Notes;
    private?: boolean;
    premium?: Premium;
    timezone?: string;
    expo_tokens?: string[];
  };

export type UserDetails = Identifiable & {
  name?: string;
  email?: string;
  pfp_url?: string;
  friends?: ID[];
  friend_requests?: ID[];
};
