import { ExternalUserSerialized, UserSerialized } from './user';

export interface Serialized {
  user_serialized: UserSerialized | ExternalUserSerialized;
}

export type Export = Serialized[keyof Serialized];
