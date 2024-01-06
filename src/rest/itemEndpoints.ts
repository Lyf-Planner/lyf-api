import express from "express";
import { ItemHandlers } from "./itemHandlers";
import { nSecondLimiter } from "./utils";

export class ItemEndpoints extends ItemHandlers {
  constructor(server: express.Application) {
    super();
    server.post("/createItem", nSecondLimiter(30, 60), this.createItem);
    server.post("/updateItem", this.updateItem);
    server.post("/getItems", this.getItems);
    // server.post("/searchItems", this.searchItems)
    server.get("/deleteItem", this.deleteItem);
    server.get("/getItem", this.getItem);

    // server.post("/addressItemSuggestion");
    // server.post("/addressItemInvite");
    // server.post("/inviteItemUser");
    // server.post("/addItemComment");
    // server.post("/editItemComment");
  }
}
