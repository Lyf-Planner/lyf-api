import { Relation } from "../api/schema";
import { BaseModel } from "./base_model";


export abstract class RelationModel<T extends Relation> extends BaseModel<T> {
    protected abstract stripPrimaryKeys(): void;
}