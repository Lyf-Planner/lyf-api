import { Time } from "../../api/abstract";
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
    // At the moment these are just the social fields
    var oldUntouchableFields = JSON.stringify(this.timeFieldsOnly(original));
    var newUntouchableFields = JSON.stringify(this.timeFieldsOnly(proposed));
    if (oldUntouchableFields !== newUntouchableFields) {
      var logger = Logger.of(TimeOperations);
      logger.error(
        `User ${user_id} tried to modify time fields on ${original.id}`
      );
      throw new Error(`Time fields cannot be modified`);
    }
  }
}
