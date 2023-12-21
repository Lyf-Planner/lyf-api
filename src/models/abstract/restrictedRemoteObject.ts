import {
  Identifiable,
  Permission,
  Restricted,
  UserAccess,
} from "../../api/abstract";
import { Collection } from "../../repository/abstractCollection";
import { RemoteObject } from "./remoteObject";

export class RestrictedRemoteObject<
  T extends Restricted & Identifiable
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

  static getUserPermission(
    access_list: UserAccess[],
    user_id: string
  ): Permission | undefined {
    var perm = access_list?.find((x) => x.user_id === user_id);
    if (!perm) return;
    else return perm.permissions;
  }
}
