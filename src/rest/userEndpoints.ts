import { UserHandlers } from "./userHandlers";
import { nSecondLimiter } from "./utils";

import express from "express";

export class UserEndpoints extends UserHandlers {
  constructor(server: express.Application) {
    super();
    server.get("/testRest", this.testRest);

    server.get("/login", nSecondLimiter(5), this.login.bind(this));
    server.get("/autoLogin", this.autoLogin.bind(this));

    server.post("/updateUser", nSecondLimiter(5), this.updateUser.bind(this));
    server.post("/deleteMe", this.deleteMe.bind(this));
  }
}
