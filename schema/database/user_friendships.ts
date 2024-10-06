import { ID, Timestamps } from './abstract';

// Notes:
// - primary key: user1_id_fk + user2_id_fk
// - foreign key: user1_id_fk (users.id)
// - foreign key: user2_id_fk (users.id)
// - user1_id_fk + user2_id_fk is indexed
// - user1_id_fk is indexed
// - user2_id_fk is indexed
// - user1_id_fk + user2_id_fk has unique constraint
// - user1_id_fk < user2_id_fk constraint

export interface UserFriendshipPrimaryKey {
  // We must enforce the constraint user1_id < user2_id, for simple searching and duplicate prevention
  // The two user ids form a composite primary key
  user1_id_fk: ID;
  user2_id_fk: ID;
}

export interface UserFriendshipRelations {
  status: UserFriendshipStatus;
}

export interface UserFriendshipDbObject extends UserFriendshipPrimaryKey, UserFriendshipRelations, Timestamps {}

// Enums

export enum UserFriendshipStatus {
  PendingFirstAcceptance = 'Pending First',
  PendingSecondAcceptance = 'Pending Second',
  Friends = 'Friends',
  PendingFirstBFFAcceptance = 'Pending BFF First',
  PendingSecondBFFAcceptance = 'Pending BFF Second',
  BFF = 'Best Friends',
  BlockedByFirst = 'Blocked By First',
  BlockedBySecond = 'Blocked By Second',
  MutualBlock = 'Mutually Blocked'
}
