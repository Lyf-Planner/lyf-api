import { loginAsTestUser } from "../users/utils";
import { exampleDatedItemCreate, exampleDatedItemGet } from "./_testdata";
import { server, serverInitialised, shutdown } from "../../src/index";
import request from "supertest";

describe("Test Item Controller", () => {
  let authToken = "";
  beforeAll(async () => {
    await serverInitialised;
    authToken = (await loginAsTestUser()) || "";
    expect(authToken).toBeTruthy();
  });

  it("Can CREATE an item, with the appropriate response", async () => {
    const response = await request(server)
      .post("/createItem")
      .set("Authorization", `Bearer ${authToken}`) // Set the authorization header
      .send(exampleDatedItemCreate);

    expect(response.status).toBe(201);
    expect(response.body).toBe(exampleDatedItemGet);
  });

  // it("Can GET an item, with the appropriate response", () => {});

  // it("Can UPDATE an item, with the appropriate response", () => {});

  // it("Can CREATE an item, with the appropriate response", () => {});
});
