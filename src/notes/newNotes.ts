import { User } from "../api/user";

export function handleNewNotesUser(user: User) {
  if (!user.notes)
    user.notes = {
      items: [],
    };
}
