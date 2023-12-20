import express from "express";
import { ItemHandlers } from "./itemHandlers";

export class ItemEndpoints extends ItemHandlers {
  constructor(server: express.Application) {
    super();
    server.post("/createItem", this.createItem);
    server.post("/updateItemMetadata", this.updateItemMetadata);
    server.post("/deleteItem", this.deleteItem);
    server.get("/getItem", this.getItem);
    server.get("/getItems", this.getItems);
    // server.post("/addressSuggestion");
    // server.post("/addressInvite");
    // server.post("/inviteUser");
    // server.post("/addComment");
    // server.post("/editComment");
  }
}
