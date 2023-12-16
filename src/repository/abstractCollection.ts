import { Collection as mongoCollection, Db, Document, ObjectId } from "mongodb";
import { ID, Identifiable } from "../api/abstract";
import { Logger } from "../utils/logging";
import assert from "assert";

// Note:
// This class purely acts as the data access layer
// Permissions and data validation should be handled by callers or parents

export class Collection<T extends Identifiable> {
  private logger = Logger.of(Collection<T>);
  protected collection: mongoCollection;

  constructor(collectionName: string, db: Db) {
    this.collection = db.collection(collectionName);
  }

  // CRUD Operations

  public async create(
    object: T,
    checkDuplicate = true,
    upsert = false
  ): Promise<T> {
    var duplicateExists = checkDuplicate
      ? await this.checkDuplicateExists(object._id)
      : false;

    if (duplicateExists) {
      // Handler will update doc if upsert = true
      return await this.handleDuplicateExists(object, upsert);
    }

    var result = await this.collection.insertOne(object);
    assert(result.acknowledged);
    object._id = result.insertedId;

    return object;
  }

  public async getManyById(ids: ID[], throwOnUnfound = true): Promise<T[]> {
    var results = (await this.collection
      .find({ _id: { $in: ids } })
      .toArray()) as any;

    results.length !== ids.length &&
      this.handleManyUnfound(results, ids, throwOnUnfound);

    return results;
  }

  public async getById(id: ID, throwOnUnfound = true): Promise<T | null> {
    var result = (await this.collection.findOne({ _id: id })) as T | null;

    result === null && this.handleSingleUnfound(id, throwOnUnfound);

    return result;
  }

  public async getWhere(
    condition: Object,
    acceptManyResults = false,
    throwOnUnfound = true
  ): Promise<T | T[] | null> {
    var result = acceptManyResults
      ? await this.collection.find(condition).toArray()
      : await this.collection.findOne(condition);

    if ((acceptManyResults && result?.length === 0) || !result)
      this.handleConditionUnfound(condition, throwOnUnfound);

    return acceptManyResults ? (result as T[]) : (result as T);
  }

  public async update(object: T, upsert = false): Promise<T> {
    var result = await this.collection.updateOne({ _id: object._id }, object, {
      upsert,
    });

    result.upsertedCount &&
      this.logger.warn(`Updated document ${object._id} was upserted!`);

    result.modifiedCount === 0 &&
      !upsert &&
      this.handleDidNotUpdate(object._id);

    return object;
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
    if (!!search) return true;
    else return false;
  }

  // Error handlers

  private handleManyUnfound(
    results: T[],
    searched: ID[],
    throwOnUnfound: boolean
  ) {
    let foundIds = results.map((x: T) => x._id) as ID[];
    let unfound = searched.filter((id: ID) => !foundIds.includes(id));

    let message = `Queried ${searched.length} documents in collection and did not find ${unfound}`;

    if (throwOnUnfound) {
      this.logger.error(message);
      throw new Error(`Documents queried were not found: ${unfound}`);
    } else this.logger.warn(message);
  }

  private handleSingleUnfound(id: ID, throwOnUnfound: boolean) {
    let message = `Queried document ${id} was not found in collection`;
    if (throwOnUnfound) {
      this.logger.error(message);
      throw new Error(message);
    } else this.logger.warn(message);
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

  private async handleDuplicateExists(object: T, upsert: boolean) {
    var message = `Create was called on object that already exists, ID ${object._id}`;
    if (upsert) {
      this.logger.warn(message + ". Updating instead!");
      return await this.update(object);
    } else {
      this.logger.error(message);
      throw new Error(message);
    }
  }

  private handleDidNotUpdate(id: ID) {
    let message = `No document with ID ${id} was found in update call, and upsert = false`;
    this.logger.error(message);
    throw new Error(message);
  }

  private handleDidNotDelete(id: ID) {
    let message = `Object with ID ${id} was not deleted properly!`;
    this.logger.error(message);
    throw new Error(message);
  }
}
