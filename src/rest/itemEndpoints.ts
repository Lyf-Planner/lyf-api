import express from "express";
import { ItemHandlers } from "./itemHandlers";

export class ItemEndpoints extends ItemHandlers {
  constructor(server: express.Application) {
    super();
    server.post("/createItem", this.createItem);
    server.post("/updateItem", this.updateItem);
    server.post("/deleteItem");
    server.get("/getItems");
  }
}
