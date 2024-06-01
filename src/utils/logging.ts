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

  public static of(arg: Function): Logger {
    return new Logger(arg.name);
  }

  constructor(name: string) {
    this.name = name;
  }

  public verbose(content: string) {
    if (Logger.level > LoggingLevel.VERBOSE) {
      return;
    }

    const str = `${new Date().toISOString()} verbose [${this.name}] ${content}`;
    console.log(str);
  }

  public debug(content: string) {
    if (Logger.level > LoggingLevel.DEBUG) {
      return;
    }
    const str = `${new Date().toISOString()} debug  [${this.name}] ${content}`;
    console.log(str);
  }

  public info(content: string) {
    if (Logger.level > LoggingLevel.INFO) {
      return;
    }
    const str = `${new Date().toISOString()} info  [${this.name}] ${content}`;
    console.log(str);
  }

  public warn(content: string) {
    if (Logger.level > LoggingLevel.WARN) {
      return;
    }
    const str = `${new Date().toISOString()} warn  [${this.name}] ${content}`;
    console.log(str);
  }

  public error(content: string) {
    if (Logger.level > LoggingLevel.ERROR) {
      return;
    }
    const str = `${new Date().toISOString()} error [${this.name}] ${content}`;
    console.log(str);
  }

  public fatal(content: string) {
    const str = `${new Date().toISOString()} fatal [${this.name}] ${content}`;
    console.log(str);
  }
}
