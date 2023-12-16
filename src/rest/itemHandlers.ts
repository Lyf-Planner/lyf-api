import { Request, Response } from "express";
import { decode, verify } from "jsonwebtoken";
import env from "../envManager";
import authUtils from "../auth/authUtils";
import db from "../repository/dbAccess";
import { Permission } from "../api/abstract";
import { ObjectId } from "mongodb";
import itemService from "../services/itemService";
import { Logger } from "../utils/logging";

export class ItemHandlers {
  private logger = Logger.of(ItemHandlers);

  protected async createItem(req: Request, res: Response) {
    var { item } = req.body;
    var user_id = authUtils.authoriseHeader(req, res);
    if (!user_id) return;

    // Instantiation stuff
    item.permitted_users = [{ user_id, permissions: Permission.Owner }];
    item.created = new Date();
    item._id = new ObjectId();

    // Should validate item input here!

    // Don't need to check duplicate if we assign an ID here - guaranteed to be unique
    var result = await db.itemsCollection().create(item, false);
    res.status(200).send(result);
  }

  protected updateItem(req: Request, res: Response) {
    var { item } = req.body;
    var user_id = authUtils.authoriseHeader(req, res);
    if (!user_id) return;

    if (!itemService.validateUserItemAccess(item, user_id)) {
      this.logger.error(
        `User ${user_id} unauthorised to access item with ID ${item._id}`
      );
      res.status(403).end(`User ${user_id} unauthorised to access this item`);
      return;
    }

    
  }
}
