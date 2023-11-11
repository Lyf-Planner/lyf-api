import { User } from "../types/user";

export function handleNewNotesUser(user: User) {
  if (!user.notes)
    user.notes = {
      items: [],
    };
}
