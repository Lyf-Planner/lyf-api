import { MongoClient, ServerApiVersion } from "mongodb";
import { Collection } from "./abstractCollection";
import { User } from "../api/user";
import { ListItem } from "../api/list";
import { Note } from "../api/notes";
import { Logger } from "../utils/logging";
import env from "../envManager";

export class Database {
  private logger = Logger.of(Database);
  private client: MongoClient = this.setClient();
  private connected = false;

  private db = this.client.db(env.mongoDb);
  private usersCollectionRef = new Collection<User>("users", this.db);
  private itemsCollectionRef = new Collection<ListItem>("items", this.db);
  private notesCollectionRef = new Collection<Note>("notes", this.db);

  public async init() {
    this.logger.info("Initialising DB connection");
    await this.client.connect();
    await this.client.db(env.mongoDb).command({ ping: 1 });
    this.connected = true;
    this.logger.info("DB initialised!");
  }

  public async close() {
    this.logger.info("Closing DB connection");
    await this.client.close();
    this.connected = false;
    this.logger.info("DB connection closed");
  }

  private initialisedGateway(returnObject: any) {
    if (!this.connected)
      this.logger.error("Waiting for DB to initialise (connecting...)");
    else return returnObject;
  }

  public usersCollection = (): Collection<User> =>
    this.initialisedGateway(this.usersCollectionRef);
  public itemsCollection = (): Collection<ListItem> =>
    this.initialisedGateway(this.itemsCollectionRef);
  public notesCollection = (): Collection<Note> =>
    this.initialisedGateway(this.notesCollectionRef);

  private setClient() {
    return new MongoClient(env.mongoUrl as string, {
      serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
      },
    });
  }
}

const db = new Database();

export default db;
