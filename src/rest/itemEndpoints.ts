import express from "express";
import { ItemHandlers } from "./itemHandlers";

export class ItemEndpoints extends ItemHandlers {
  constructor(server: express.Application) {
    super();
    server.post("/createItem", this.createItem);
    server.post("/updateItem", this.updateItem);
    server.post("/deleteItem", this.deleteItem);
    server.post("/getItems", this.getItems);
    server.get("/getItem", this.getItem);

    // server.post("/addressItemSuggestion");
    // server.post("/addressItemInvite");
    // server.post("/inviteItemUser");
    // server.post("/addItemComment");
    // server.post("/editItemComment");
  }
}
