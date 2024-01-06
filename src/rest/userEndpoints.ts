import { UserHandlers } from "./userHandlers";
import { nSecondLimiter } from "./utils";

import express from "express";

export class UserEndpoints extends UserHandlers {
  constructor(server: express.Application) {
    super();
    server.get("/login", nSecondLimiter(3), this.login);
    server.get("/autoLogin", this.autoLogin);

    server.post("/createUser", nSecondLimiter(20), this.createUser);
    server.get("/getUser", this.getUser);
    server.get("/getUsers", this.getUsers);
    server.post("/updateUser", this.updateUser);
    server.post("/deleteMe", this.deleteMe);

    // server.post("/updatePremium")
    // server.post("/updateFriend")
    // server.post("/addressFriendInvite")
  }
}
