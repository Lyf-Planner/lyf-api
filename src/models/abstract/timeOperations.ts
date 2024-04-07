import { Time } from "../../api/mongo_schema/abstract";
import { Logger } from "../../utils/logging";

export class TimeOperations {
  public static timeFieldsOnly(object: any): Time {
    return {
      created: object.created,
      last_updated: object.last_updated,
    };
  }

  public static throwIfTimeFieldsModified(
    original: any,
    proposed: any,
    user_id: string
  ) {
    const modified =
      (proposed.created && proposed.created !== original.created) ||
      (proposed.last_updated &&
        proposed.last_updated !== original.last_updated);

    if (modified) {
      var logger = Logger.of(TimeOperations);
      logger.error(
        `User ${user_id} tried to modify time fields on ${original.id}`
      );
      throw new Error(`Time fields cannot be modified`);
    }
  }
}
