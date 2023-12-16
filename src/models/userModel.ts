import { ID } from "../api/abstract";
import { UserListItem } from "../api/list";
import { User } from "../api/user";
import db from "../repository/dbAccess";
import itemService from "../services/itemService";

export class UserModel {
  private user_id: string;
  public user?: User;

  constructor(user_id: string) {
    this.user_id = user_id;
  }

  public async instantiate() {
    this.user = (await db
      .usersCollection()
      .getWhere({ user_id: this.user_id })) as User;
  }

  public addNoteData() {}

  public async addListData() {
    // Note: The efficiency of this section could definitely be improved
    var items = this.user!.timetable?.items;
    var queryIds = items?.map((x) => x._id) as ID[];
    var data = await itemService.getUserItems(queryIds, this.user_id);

    // Match data to user items
    this.user?.timetable?.items.forEach((x) => {
      x.data = data.find((y) => y._id === x._id);
    });

    // Filter out anything without data
    this.user!.timetable!.items = this.user?.timetable?.items.filter(
      (x) => !!x.data
    ) as UserListItem[];
  }
}
