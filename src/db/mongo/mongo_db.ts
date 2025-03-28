import { Db, MongoClient, ServerApiVersion } from 'mongodb';

import { ListItem } from '../../../schema/mongo_schema/list';
import { Note } from '../../../schema/mongo_schema/notes';
import { User } from '../../../schema/mongo_schema/user';
import env from '../../envManager';
import { Logger } from '../../utils/logging';

import { Collection } from './mongo_collection';

// Note:
// Mongo used to be the main database, but that is now Postgres
// However, Mongo is still used by Agenda.js to store cron scheduled data (namely, notifications)

export class MongoDatabase {
  private logger = Logger.of(MongoDatabase.name);
  private connected = false;

  private client: MongoClient;
  private database: Db;
  private usersCollectionRef: Collection<User>;
  private itemsCollectionRef: Collection<ListItem>;
  private notesCollectionRef: Collection<Note>;

  constructor(connectionUrl?: string, dbName?: string) {
    this.client = this.setClient(connectionUrl);
    this.database = this.client.db(dbName || env.mongoDb);
    this.usersCollectionRef = new Collection<User>('users', this.database);
    this.itemsCollectionRef = new Collection<ListItem>('items', this.database);
    this.notesCollectionRef = new Collection<Note>('notes', this.database);
  }

  public getDb() {
    return this.database;
  }

  public async init() {
    this.logger.info('Initialising DB connection');
    await this.client.connect();
    await this.database.command({ ping: 1 });
    this.connected = true;
    this.logger.info('DB initialised!');
  }

  public async close() {
    this.logger.info('Closing DB connection');
    await this.client.close();
    this.connected = false;
    this.logger.info('DB connection closed');
  }

  public usersCollection = (): Collection<User> => this.initialisedGateway(this.usersCollectionRef);
  public itemsCollection = (): Collection<ListItem> =>
    this.initialisedGateway(this.itemsCollectionRef)
  public notesCollection = (): Collection<Note> => this.initialisedGateway(this.notesCollectionRef);

  private initialisedGateway(returnObject: any) {
    if (!this.connected) {
      this.logger.error('Waiting for DB to initialise (connecting...)');
    } else {
      return returnObject;
    }
  }

  private setClient(connectionUrl?: string) {
    return new MongoClient(connectionUrl || (env.mongoUrl as string), {
      serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true
      }
    });
  }
}

const mongoDb = new MongoDatabase();

export default mongoDb;
