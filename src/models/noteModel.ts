import { ID, Permission } from "../api/abstract";
import { Note } from "../api/notes";
import db from "../repository/dbAccess";
import { Logger } from "../utils/logging";
import { RemoteObject } from "./abstract/remoteObject";
import { RestrictedRemoteObject } from "./abstract/restrictedRemoteObject";
import { TimeOperations } from "./abstract/timeOperations";
import { NoteOperations } from "./noteOperations";

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

    // 2. Cannot modify social fields on this endpoint
    this.throwIfEditorModifiedPerms(proposed, perm);

    // 3. No one should modify time fields
    TimeOperations.throwIfTimeFieldsModified(this.content, proposed, user_id);

    // Checks passed!
    this.logger.info(
      `User ${this.requested_by} safely updated note ${this.id}`
    );
    this.content = proposed;
    this.commit();
  }

  public export() {
    var { ...exported } = this.content;
    return exported;
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

  private throwIfEditorModifiedPerms(proposed: Note, perm?: Permission) {
    if (perm === Permission.Editor) {
      var oldPerms = JSON.stringify(
        NoteOperations.permissionsField(this.content)
      );
      var newPerms = JSON.stringify(NoteOperations.permissionsField(proposed));

      if (oldPerms !== newPerms) {
        this.logger.error(
          `User ${this.requested_by} tried to modify permissions on ${this.id}`
        );
        throw new Error(`Editors cannot modify permissions`);
      }
    }
  }
}
