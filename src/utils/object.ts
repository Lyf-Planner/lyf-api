export class ObjectUtils {
  static isEmpty(obj: object) {
    return Object.keys(obj).length === 0 && obj.constructor === Object;
  }

  static stripUndefinedFields(obj: object) {
    // JSON.stringify always strips undefined when parsing
    return JSON.parse(JSON.stringify(obj))
  }
}
