import { ID } from "../api/abstract";
import { ListItem } from "../api/list";
import { Logger } from "../utils/logging";
import db from "../repository/dbAccess";

export class ItemService {
  private logger = Logger.of(ItemService);

  public async getUserItems(ids: ID[], user_id: string) {
    var results = await db.itemsCollection().getManyById(ids, false);
    var filteredResults = results.filter((x) =>
      this.validateUserItemAccess(x, user_id)
    );
    if (filteredResults.length !== results.length)
      this.logger.warn(
        `User no longer has access to ${
          results.length - filteredResults.length
        } items`
      );

    return filteredResults;
  }

  public validateUserItemAccess(item: ListItem, user_id: string) {
    return (
      !item.permitted_users ||
      item.permitted_users.filter((x) => x.user_id === user_id).length === 1
    );
  }


}

const itemService = new ItemService();

export default itemService;
