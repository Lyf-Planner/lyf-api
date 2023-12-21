import { ID, Permission } from "../api/abstract";
import { Note } from "../api/notes";
import db from "../repository/dbAccess";
import { Logger } from "../utils/logging";
import { RemoteObject } from "./abstract/remoteObject";
import { RestrictedRemoteObject } from "./abstract/restrictedRemoteObject";

export class NoteModel extends RestrictedRemoteObject<Note> {
  private logger = Logger.of(NoteModel);

  constructor(note: Note, from_db: boolean = false, requested_by: string) {
    super(db.notesCollection(), note, from_db, requested_by);
  }

  public async safeUpdate(proposed: Note, user_id: string) {
    var perm = RestrictedRemoteObject.getUserPermission(
      this.content.permitted_users,
      user_id
    );

    // 1. User cannot be Viewer
    this.throwIfReadOnly(perm);

    // Checks passed!
    this.logger.info(
      `User ${this.requested_by} safely updated note ${this.id}`
    );
    this.content = proposed;
    this.commit();
  }

  // Helpers
  private throwIfReadOnly(perm?: Permission) {
    if (!perm || perm === Permission.Viewer) {
      this.logger.error(
        `User ${this.requested_by} tried to modify as Viewer on ${this.id}`
      );
      throw new Error(`User does not have permission to edit this item`);
    }
  }
}
