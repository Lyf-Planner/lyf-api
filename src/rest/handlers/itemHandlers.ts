import { Request, Response } from "express";
import { Permission } from "../../api/social";
import { Logger } from "../../utils/logging";
import { ItemModel } from "../../models/items/itemModel";
import { ItemOperations } from "../../models/items/ItemOperations";
import { getMiddlewareVars } from "../utils";
import {
  createItemBody,
  getItemsBody,
  inviteUserBody,
  addressItemInviteBody,
  updateItemBody,
} from "../validators/itemValidators";
import { UserOperations } from "../../models/users/userOperations";
import { SocialItem } from "../../models/social/socialItem";
import { SocialUser } from "../../models/social/socialUser";

export class ItemHandlers {
  protected async createItem(req: Request, res: Response) {
    // Users only type a name in a section (implying type) to create an item
    // Should reevaluate this if we ever grant API access!
    var itemInput = req.body as createItemBody;
    var user_id = getMiddlewareVars(res).user_id;

    logger.debug(`Creating item ${itemInput.title} from user ${user_id}`);

    // Instantiate
    var model = await ItemOperations.createNew(itemInput, user_id, true);

    res.status(200).json(model.export()).end();
  }

  protected async updateItem(req: Request, res: Response) {
    var item = req.body as updateItemBody;
    var user_id = getMiddlewareVars(res).user_id;

    var remoteItem: ItemModel;
    logger.debug(
      `Updating item ${item.title} (${item.id}) from user ${user_id}`
    );

    // Authorisation checks
    try {
      // These fns will check user is permitted on the item and has Permission > Viewer
      remoteItem = await ItemOperations.retrieveForUser(item.id, user_id);
      await remoteItem.safeUpdate(item, user_id);
    } catch (err) {
      logger.error(
        `User ${user_id} did not safely update item ${item.id}: ${err}`
      );
      res.status(403).end(`${err}`);
      return;
    }

    res.status(200).end();
  }

  protected async deleteItem(req: Request, res: Response) {
    var { item_id } = req.query;
    var user_id = getMiddlewareVars(res).user_id;

    logger.debug(`Deleting item ${item_id} as requested by ${user_id}`);

    // Authorisation checks
    var item: ItemModel;
    try {
      var item = await ItemOperations.retrieveForUser(
        item_id as string,
        user_id
      );
      var perm = item.requestorPermission();
      if (!perm || perm !== Permission.Owner)
        throw new Error(`Items can only be deleted by their owner/creator`);
    } catch (err) {
      logger.error(
        `User ${user_id} tried to delete ${item_id} without valid permissions`
      );
      res.status(403).end(`${err}`);
      return;
    }

    // Perform delete
    await item!.delete();
    res.status(200).end();
  }

  protected async getItem(req: Request, res: Response) {
    var { item_id } = req.query as any;
    var user_id = getMiddlewareVars(res).user_id;

    logger.debug(`Retreiving item ${item_id} for user ${user_id}`);

    // Authorisation checks
    var item: ItemModel;
    try {
      item = await ItemOperations.retrieveForUser(item_id, user_id);
    } catch (err) {
      logger.error(
        `User ${user_id} requested item ${item_id} to which they don't have access`
      );
      res.status(403).end(`${err}`);
    }

    res.status(200).json(item!.export()).end();
  }

  protected async getItems(req: Request, res: Response) {
    var { item_ids } = req.body as getItemsBody;
    var user_id = getMiddlewareVars(res).user_id;

    logger.debug(`Retreiving ${item_ids.length} items for user ${user_id}`);

    // No auth checks - automatically excludes those without perms
    var items = await ItemOperations.getRawUserItems(item_ids, user_id, true);
    logger.debug(`Got ${items.length} items for user`);

    res.status(200).json(items!).end();
  }

  protected async inviteUser(req: Request, res: Response) {
    const { item_id, user_id } = req.body as inviteUserBody;
    var invited_by = getMiddlewareVars(res).user_id;

    logger.info(`Inviting user ${user_id} to item ${item_id}`);

    if (user_id === invited_by) {
      res.status(400).end("You can't invite yourself to the item :)");
      return;
    }

    try {
      var item = (await ItemOperations.retrieveForUser(
        item_id,
        invited_by,
        true,
        true
      )) as SocialItem;

      var invitee = (await UserOperations.retrieveForUser(
        user_id,
        invited_by,
        true
      )) as SocialUser;

      // Update item data
      await item.inviteUser(invitee, invited_by);

      // Update user data
      invitee.receiveItemInvite(item_id, invited_by);

      // Publish changes if no errors
      await item.approveSocialChanges();
      await invitee.approveSocialChanges();

      res.status(200).json(item.getContent().invited_users).end();
    } catch (err) {
      res.status(400).end(`${err}`);
    }
  }

  protected async addressItemInvite(req: Request, res: Response) {
    const { item_id, accepted_invite } = req.body as addressItemInviteBody;
    const user_id = getMiddlewareVars(res).user_id;

    try {
      let item = (await ItemOperations.retrieveForUser(
        item_id,
        user_id,
        true,
        true
      )) as SocialItem;
      let user = (await UserOperations.retrieveForUser(
        user_id,
        user_id,
        true
      )) as SocialUser;

      // Update item data
      item.addressInvite(user_id, accepted_invite);

      // Update user data
      user.addressItemInvite(item_id, accepted_invite);

      // Publish changes if no errors
      await item.approveSocialChanges();
      await user.approveSocialChanges();

      res.status(200).end();
    } catch (err) {
      res.status(400).end(`${err}`);
    }
  }
}

const logger = Logger.of(ItemHandlers);
