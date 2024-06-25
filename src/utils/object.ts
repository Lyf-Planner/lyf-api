export class ObjectUtils {
  static isEmpty(obj: Object) {
    return Object.keys(obj).length === 0 && obj.constructor === Object;
  }

  static stripKeys(obj: any, keys: string[]) {
    return Object.keys(obj).reduce((acc, key) => {
      if (keys.includes(key)) {
        acc[key] = obj[key]
      }
  
      return acc
    }, {} as any)
  }
}
