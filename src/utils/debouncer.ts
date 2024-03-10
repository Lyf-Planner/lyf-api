import { Logger } from "./logging";

type UniqueFunctionRun = {
  signature: any;
  timeout: NodeJS.Timeout;
};

export class Debouncer {
  private uniqueRuns: UniqueFunctionRun[] = [];
  private logger = Logger.of(Debouncer);

  public runFunc(func: () => any, signature: any, duration = 1000) {
    let i = this.uniqueRuns.findIndex(
      (x) => JSON.stringify(x.signature) === JSON.stringify(signature)
    );

    // Function is not currently queued
    if (i === -1) {
      const timeout = setTimeout(() => {
        func();
        this.cleanupRun(signature);
      }, duration);

      this.uniqueRuns.push({
        signature,
        timeout,
      });
      // Else reset function timer
    } else {
      this.logger.debug(
        `Debouncing function with data ${JSON.stringify(this.uniqueRuns[i].signature)}`
      );
      clearTimeout(this.uniqueRuns[i].timeout);
      this.uniqueRuns[i].timeout = setTimeout(() => {
        func();
        this.cleanupRun(signature);
      }, duration);
    }
  }

  private cleanupRun(signature: any) {
    let i = this.uniqueRuns.findIndex(
      (x) => JSON.stringify(x.signature) === JSON.stringify(signature)
    );
    if (i === -1) return;

    this.uniqueRuns.splice(i, 1);
  }
}

const debouncer = new Debouncer();

export default debouncer;
