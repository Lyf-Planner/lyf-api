import { User } from "../schema/user";

export function handleNewNotesUser(user: User) {
  if (!user.notes)
    user.notes = {
      items: [],
    };
}
