import { Db, MongoClient, ServerApiVersion } from "mongodb";
import { Collection } from "./abstractCollection";
import { User } from "../api/user";
import { ListItem } from "../api/list";
import { Note } from "../api/notes";
import { Logger } from "../utils/logging";
import env from "../envManager";

export class Database {
  private logger = Logger.of(Database);
  private connected = false;

  private client: MongoClient;
  private db: Db;
  private usersCollectionRef: Collection<User>;
  private itemsCollectionRef: Collection<ListItem>;
  private notesCollectionRef: Collection<Note>;

  constructor(connectionUrl?: string, dbName?: string) {
    this.client = this.setClient(connectionUrl);
    this.db = this.client.db(dbName || env.mongoDb);
    this.usersCollectionRef = new Collection<User>("users", this.db);
    this.itemsCollectionRef = new Collection<ListItem>("items", this.db);
    this.notesCollectionRef = new Collection<Note>("notes", this.db);
  }

  public async init() {
    this.logger.info("Initialising DB connection");
    await this.client.connect();
    await this.db.command({ ping: 1 });
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

  private setClient(connectionUrl?: string) {
    return new MongoClient(connectionUrl || (env.mongoUrl as string), {
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
