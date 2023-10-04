import { User } from "../types";

export function handleNewNotesUser(user: User) {
  if (!user.notes)
    user.notes = {
      items: [],
    };
}
