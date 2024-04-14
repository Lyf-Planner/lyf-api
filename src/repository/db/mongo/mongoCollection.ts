import { Collection as mongoCollection, Db } from 'mongodb';

import assert from 'assert';
import { DBObject, ID } from '../../../api/mongo_schema/abstract';
import { Logger } from '../../../utils/logging';

// Note:
// This class purely acts as the data access layer
// Permissions and data validation should be handled by callers or parents

export class Collection<T extends DBObject> {
  protected collection: mongoCollection;
  private logger = Logger.of(Collection<T>);

  constructor(collectionName: string, db: Db) {
    this.collection = db.collection(collectionName);
  }

  // CRUD Operations

  public async create(object: T, checkDuplicate = true): Promise<T> {
    var duplicateExists = checkDuplicate
      ? await this.checkDuplicateExists(object.id)
      : false;

    if (duplicateExists) { await this.handleDuplicateExists(object); }

    var toInsert = object as any;
    toInsert._id = object.id; // We don't use Mongo ObjectIds, just UUIDs
    delete toInsert.id;
    toInsert.last_updated = new Date().toISOString();
    toInsert.created = new Date().toISOString();
    var result = await this.collection.insertOne(object);
    assert(result.acknowledged);

    return this.exportWithoutUnderscoreId(toInsert);
  }

  public async findAll() {
    var results = (await this.collection.find().toArray()) as any;

    results = results.map((x: any) => this.exportWithoutUnderscoreId(x));
    return results;
  }

  public async getManyById(ids: ID[], throwOnUnfound = true): Promise<T[]> {
    // This operation looks weird because we want to return in the same order we search
    var results = (await this.collection
      .aggregate([
        { $match: { _id: { $in: ids } } },
        {
          $addFields: {
            index: {
              $indexOfArray: [ids, '$_id']
            }
          }
        },
        { $sort: { index: 1 } }
      ])
      .toArray()) as any;

    results.length !== ids.length &&
      this.handleManyUnfound(results, ids, throwOnUnfound);

    results = results.map((x: any) => this.exportWithoutUnderscoreId(x));
    return results;
  }

  public async getById(id: ID, throwOnUnfound = true): Promise<T | null> {
    var result = (await this.collection.findOne({
      _id: id
    })) as T | null;

    result === null && this.handleSingleUnfound(id, throwOnUnfound);

    return this.exportWithoutUnderscoreId(result);
  }

  public async getWhere(
    condition: Object,
    acceptManyResults = false,
    throwOnUnfound = true
  ): Promise<T | T[] | null> {
    var result = acceptManyResults
      ? ((await this.collection.find(condition).toArray()) as any)
      : ((await this.collection.findOne(condition)) as any);

    if ((acceptManyResults && result?.length === 0) || !result) {
      this.handleConditionUnfound(condition, throwOnUnfound);
    }

    if (acceptManyResults) {
      result = result?.map((x: any) => this.exportWithoutUnderscoreId(x));
    }
    else { result = this.exportWithoutUnderscoreId(result); }

    return acceptManyResults ? (result as T[]) : (result as T);
  }

  public async update(object: T, upsert = false): Promise<T> {
    var insert = object as any;
    insert._id = object.id;
    delete insert.id;
    insert.last_updated = new Date().toISOString();
    if (!insert.created && upsert) { insert.created = new Date().toISOString(); }
    var result = await this.collection.updateOne(
      { _id: insert._id },
      { $set: { ...insert } },
      {
        upsert
      }
    );
    assert(result.acknowledged);

    result.modifiedCount === 0 &&
      !upsert &&
      this.handleDidNotUpdate(object.id, false);

    return this.exportWithoutUnderscoreId(object);
  }

  public async delete(id: ID): Promise<boolean> {
    var result = await this.collection.deleteOne({ _id: id });
    if (result.deletedCount === 0) {
      this.handleDidNotDelete(id);
      return false;
    }

    return true;
  }

  // Helpers

  private async checkDuplicateExists(id: ID) {
    var search = await this.collection.findOne({ _id: id });
    if (!!search) { return true; }
    else { return false; }
  }

  // Error handlers

  private handleManyUnfound(
    results: T[],
    searched: ID[],
    throwOnUnfound: boolean
  ) {
    const foundIds = results.map((x: T) => x.id) as ID[];

    const message = `Queried ${
      searched.length
    } documents in collection and did not find ${
      searched.length - results.length
    }`;

    if (throwOnUnfound) {
      this.logger.error(message);
      throw new Error('Documents queried were not found');
    } else { this.logger.warn(message); }
  }

  private handleSingleUnfound(id: ID, throwOnUnfound: boolean) {
    const message = `Queried document ${id} was not found in collection`;
    if (throwOnUnfound) {
      this.logger.error(message);
      throw new Error(message);
    } else { this.logger.warn(message); }
  }

  private handleConditionUnfound(condition: Object, throwOnUnfound: boolean) {
    var message = `No results were found for query of docs where ${condition}`;
    if (throwOnUnfound) {
      this.logger.error(message);
      throw new Error(message);
    } else {
      this.logger.warn(message);
    }
  }

  private async handleDuplicateExists(object: T) {
    var message = `Create was called on object that already exists, ID ${object.id}`;
    this.logger.error(message);
    throw new Error(message);
  }

  private handleDidNotUpdate(id: ID, shouldThrow = true) {
    const message = `No document with ID ${id} was found in update call, and upsert = false`;
    if (shouldThrow) {
      this.logger.error(message);
      throw new Error(message);
    } else {
      this.logger.warn(message);
    }
  }

  private handleDidNotDelete(id: ID) {
    const message = `Object with ID ${id} was not deleted properly!`;
    this.logger.error(message);
    throw new Error(message);
  }

  private exportWithoutUnderscoreId(object: any) {
    object.id = object._id;
    delete object._id;
    return object;
  }
}
