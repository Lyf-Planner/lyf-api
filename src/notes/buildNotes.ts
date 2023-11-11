import { User } from "../types/user";
import { handleNewNotesUser } from "./newNotes";

export function buildNotes(user: User) {
  // Not much needed so far - keep the abstraction layer in case of future changes
  handleNewNotesUser(user);
}
