import { ID, Identifiable, Time } from './abstract';
import { Notes } from './notes';
import { Premium } from './premium';
import { Timetable } from './timetable';

// Instead of using Identifiable, we use user_id as id
export type User = Time &
  Identifiable & {
    pass_hash: string;
    details: UserDetails;
    timetable: Timetable;
    notes: Notes;
    social: UserSocial;
    private?: boolean;
    premium?: Premium; // Need to change this to settings
    timezone?: string;
    expo_tokens?: string[];
  };

export type UserDetails = Identifiable & {
  name?: string;
  email?: string;
  pfp_url?: string;
};

export type UserSocial = {
  friends?: ID[];
  requests?: ID[];
  requested?: ID[];
  blocked?: ID[];
};

export type Friendship = {
  id: ID;
};
