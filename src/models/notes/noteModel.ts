import { Permission } from "../../api/social";
import { Note } from "../../api/notes";
import { Logger } from "../../utils/logging";
import { RestrictedRemoteObject } from "../abstract/restrictedRemoteObject";
import { updateNoteBody } from "../../rest/validators/noteValidators";
import db from "../../repository/dbAccess";

export class NoteModel extends RestrictedRemoteObject<Note> {
  private logger = Logger.of(NoteModel);

  constructor(note: Note, from_db: boolean = false, requested_by: string) {
    super(db.notesCollection(), note, from_db, requested_by);
  }

  public async safeUpdate(proposed: updateNoteBody, user_id: string) {
    var perm = this.getUserPermission(user_id);

    // 1. User cannot be Viewer
    this.throwIfReadOnly(perm);

    // 2. Cannot modify social fields unless you are the owner
    this.throwIfNonOwnerModifiedPerms(proposed, perm);

    // Checks passed!
    this.logger.debug(
      `User ${this.requested_by} safely updated note ${this.id}`
    );

    // Apply changeset
    this.content = { ...this.content, ...proposed };
    await this.commit();
  }

  public export() {
    var { ...exported } = this.content;
    return exported;
  }

  // Helpers
  private throwIfReadOnly(perm?: Permission) {
    if (!perm || perm === Permission.Viewer || perm === Permission.Invitee) {
      this.logger.error(
        `User ${this.requested_by} tried to modify as Viewer on ${this.id}`
      );
      throw new Error(`User does not have permission to edit this item`);
    }
  }

  private throwIfNonOwnerModifiedPerms(proposed: Note, perm?: Permission) {
    if (perm !== Permission.Owner) {
      var oldPerms = JSON.stringify(
        RestrictedRemoteObject.extractPermissionFields(this.content)
      );
      var newPerms = JSON.stringify(
        RestrictedRemoteObject.extractPermissionFields(proposed)
      );

      if (newPerms && oldPerms !== newPerms) {
        this.logger.error(
          `User ${this.requested_by} tried to modify permissions on ${this.id}`
        );
        throw new Error(`Non-owners cannot modify permissions`);
      }
    }
  }
}
