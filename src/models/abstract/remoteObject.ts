import { DBObject, ID } from "../../api/abstract";
import { Collection } from "../../repository/abstractCollection";

export class RemoteObject<T extends DBObject> {
  protected id: ID;
  protected collectionRef: Collection<T>;
  protected content: T;
  protected from_db: boolean;

  constructor(collection: any, content: T, from_db: boolean = false) {
    this.collectionRef = collection;
    this.content = content;
    this.id = content.id;
    this.from_db = from_db;
  }

  public async commit(): Promise<void> {
    this.content = await this.collectionRef.update(this.content, true);
  }

  public async deleteFromDb(): Promise<void> {
    await this.collectionRef.delete(this.content.id);
    this.from_db = false;
  }

  public getContent(): T {
    return this.content;
  }

  public async getRemoteCopy(): Promise<T | null> {
    return await this.collectionRef.getById(this.id);
  }

  public isFromDb(): boolean {
    return this.from_db;
  }
}
