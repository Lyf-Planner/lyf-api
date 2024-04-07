import { DBObject } from "../../api/mongo_schema/abstract";
import { Permission, Restricted } from "../../api/mongo_schema/social";
import { Collection } from "../../repository/abstractCollection";
import { RemoteObject } from "./remoteObject";

export class RestrictedRemoteObject<
  T extends Restricted & DBObject
> extends RemoteObject<T> {
  protected requested_by: string;

  constructor(
    collection: Collection<T>,
    content: T,
    from_db: boolean = false,
    requested_by: string
  ) {
    super(collection, content, from_db);
    this.requested_by = requested_by;
  }

  public getRequestor = () => this.requested_by;

  public requestorPermission() {
    return this.content.permitted_users?.find(
      (x) => x.user_id === this.requested_by
    )?.permissions;
  }

  public validateRequestorItemAccess(): boolean {
    return (
      this.content.permitted_users.filter(
        (x) => x.user_id === this.requested_by
      ).length === 1
    );
  }

  static extractPermissionFields(object: Restricted) {
    return {
      permitted_users: object.permitted_users,
      invited_users: object.invited_users,
    };
  }

  public getUserPermission(user_id: string): Permission | undefined {
    var perm = this.content.permitted_users?.find((x) => x.user_id === user_id);
    var invite = this.content.invited_users?.find((x) => x.user_id === user_id);

    if (!perm && !invite) return;
    else if (invite) return Permission.Invited;
    else if (perm) return perm.permissions;
  }
}
