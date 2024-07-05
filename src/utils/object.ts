export class ObjectUtils {
  static isEmpty(obj: Object) {
    return Object.keys(obj).length === 0 && obj.constructor === Object;
  }

  static stripUndefinedFields(obj: object) {
    // Utilise the often annoying fact JSON.stringify always strips undefined when parsing ;)
    return JSON.parse(JSON.stringify(obj))
  }
}
