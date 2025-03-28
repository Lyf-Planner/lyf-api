export enum LoggingLevel {
  VERBOSE = 0,
  DEBUG = 1,
  INFO = 2,
  WARN = 3,
  ERROR = 4,
  FATAL = 5
}

export class Logger {
  static level: LoggingLevel = LoggingLevel.DEBUG;
  private name: string;

  public static setLevel(level: LoggingLevel) {
    this.level = level;
  }

  public static of(name: string): Logger {
    return new Logger(name);
  }

  constructor(name: string) {
    this.name = name;
  }

  public verbose(content: string, data?: unknown) {
    if (Logger.level > LoggingLevel.VERBOSE) {
      return;
    }

    const str = `${new Date().toISOString()} verbose [${this.name}] ${content} ${JSON.stringify(data)}`;
    console.log(str);
  }

  public debug(content: string, data?: unknown) {
    if (Logger.level > LoggingLevel.DEBUG) {
      return;
    }
    const str = `${new Date().toISOString()} debug  [${this.name}] ${content} ${JSON.stringify(data)}`;
    console.log(str);
  }

  public info(content: string, data?: unknown) {
    if (Logger.level > LoggingLevel.INFO) {
      return;
    }
    const str = `${new Date().toISOString()} info  [${this.name}] ${content} ${JSON.stringify(data)}`;
    console.log(str);
  }

  public warn(content: string, data?: unknown) {
    if (Logger.level > LoggingLevel.WARN) {
      return;
    }
    const str = `${new Date().toISOString()} warn  [${this.name}] ${content} ${JSON.stringify(data)}`;
    console.log(str);
  }

  public error(content: string, data?: unknown) {
    if (Logger.level > LoggingLevel.ERROR) {
      return;
    }
    const str = `${new Date().toISOString()} error [${this.name}] ${content} ${JSON.stringify(data)}`;
    console.log(str);
  }

  public fatal(content: string, data?: unknown) {
    const str = `${new Date().toISOString()} fatal [${this.name}] ${content} ${JSON.stringify(data)}`;
    console.log(str);
  }
}
