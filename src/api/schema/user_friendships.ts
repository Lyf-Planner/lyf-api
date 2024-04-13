import { ID, DbObject } from './abstract';
import { User } from './user';

export enum UserFriendshipStatus {
  PendingFirstAcceptance = 'Pending First',
  PendingSecondAcceptance = 'Pending Second',
  Friends = 'Friends',
  BlockedByFirst = 'Blocked By First',
  BlockedBySecond = 'Blocked By Second',
  MutualBlock = 'Mutually Blocked'
  // None => object should be deleted!
}

export interface UserFriendshipDbObject extends DbObject {
  // We must enforce the constraint user1_id < user2_id, for simple searching and duplicate prevention
  // The two user ids form a composite primary key
  user1_id_fk: ID;
  user2_id_fk: ID;
  status: UserFriendshipStatus;
};

export interface UserFriendship extends UserFriendshipDbObject {
  user1: User;
  user2: User;
}