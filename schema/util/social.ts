import { ID } from "../database/abstract";
import { UserFriendshipStatus } from "../database/user_friendships";
import { UserFriend } from "../user";

export enum SocialAction {
  Invite = 'Invite',
  Cancel = 'Cancel',
  Accept = 'Accept',
  Decline = 'Decline',
  Remove = 'Remove'
}

export enum FriendshipAction {
  Accept = 'Accept',
  Block = 'Block',
  Cancel = 'Cancel',
  Decline = 'Decline',
  Remove = 'Remove',
  Request = 'Request',
  Unblock = 'Unblock'
}

export const hasIncomingRequest = (user_id: ID, friend: UserFriend) => {
  const [user1_id, user2_id] = sortFriendIds(user_id, friend.id)

  return (
    user1_id === user_id && friend.status === UserFriendshipStatus.PendingFirstAcceptance ||
    user2_id === user_id && friend.status === UserFriendshipStatus.PendingSecondAcceptance
  )
}

export const hasOutgoingRequest = (user_id: ID, friend: UserFriend) => {
  const [user1_id, user2_id] = sortFriendIds(user_id, friend.id)

  return (
    user1_id === user_id && friend.status === UserFriendshipStatus.PendingSecondAcceptance ||
    user2_id === user_id && friend.status === UserFriendshipStatus.PendingFirstAcceptance
  )
}

export const hasIncomingBFFRequest = (user_id: ID, friend: UserFriend) => {
  const [user1_id, user2_id] = sortFriendIds(user_id, friend.id)

  return (
    user1_id === user_id && friend.status === UserFriendshipStatus.PendingFirstBFFAcceptance ||
    user2_id === user_id && friend.status === UserFriendshipStatus.PendingSecondBFFAcceptance
  )
}

export const hasOutgoingBFFRequest = (user_id: ID, friend: UserFriend) => {
  const [user1_id, user2_id] = sortFriendIds(user_id, friend.id)

  return (
    user1_id === user_id && friend.status === UserFriendshipStatus.PendingSecondBFFAcceptance ||
    user2_id === user_id && friend.status === UserFriendshipStatus.PendingFirstBFFAcceptance
  )
}

export const hasFriendship = (friend: UserFriend) => {
  return (
    friend.status === UserFriendshipStatus.Friends ||
    friend.status === UserFriendshipStatus.BFF
  );
}

export const hasBlock = (friend: UserFriend) => {
  return (
    friend.status === UserFriendshipStatus.BlockedByFirst ||
    friend.status === UserFriendshipStatus.BlockedBySecond ||
    friend.status === UserFriendshipStatus.MutualBlock
  )
}

export const sortFriendIds = (user1_id: ID, user2_id: ID) => {
  return [user1_id, user2_id].sort();
}