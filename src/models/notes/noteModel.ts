import { Permission } from '../../api/mongo_schema/social';
import { Note } from '../../api/mongo_schema/notes';
import { Logger } from '../../utils/logging';
import { RestrictedRemoteObject } from '../abstract/restrictedRemoteObject';
import { updateNoteBody } from '../../controller/validators/noteValidators';
import db from '../../repository/db/mongo/mongoDb';

export class NoteModel extends RestrictedRemoteObject<Note> {
  private logger = Logger.of(NoteModel);

  constructor(note: Note, from_db: boolean = false, requested_by: string) {
    super(db.notesCollection(), note, from_db, requested_by);
  }

  public async safeUpdate(proposed: updateNoteBody, user_id: string) {
    var perm = this.getUserPermission(user_id);

    // 1. User cannot be Viewer
    this.throwIfReadOnly(perm);

    // Checks passed!
    this.logger.debug(`User ${this.requested_by} safely updated note ${this.id}`);

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
    if (!perm || perm === Permission.Viewer || perm === Permission.Invited) {
      this.logger.error(`User ${this.requested_by} tried to modify as Viewer on ${this.id}`);
      throw new Error(`User does not have permission to edit this item`);
    }
  }

  private throwIfNonOwnerModifiedPerms(proposed: Note, perm?: Permission) {
    if (perm !== Permission.Owner) {
      var oldPerms = JSON.stringify(RestrictedRemoteObject.extractPermissionFields(this.content));
      var newPerms = JSON.stringify(RestrictedRemoteObject.extractPermissionFields(proposed));

      if (newPerms && oldPerms !== newPerms) {
        this.logger.error(`User ${this.requested_by} tried to modify permissions on ${this.id}`);
        throw new Error(`Non-owners cannot modify permissions`);
      }
    }
  }
}
