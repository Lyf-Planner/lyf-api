import { Logger } from "./logging";

type UniqueFunctionRun = {
  unique_data: any;
  timeout: NodeJS.Timeout;
};

export class Debouncer {
  private uniqueRuns: UniqueFunctionRun[] = [];
  private logger = Logger.of(Debouncer);

  public runFunc(func: () => any, unique_data: any, duration = 1000) {
    const currentData = this.uniqueRuns.map((x) => x.unique_data);
    let i = currentData.findIndex(
      (x) => JSON.stringify(x) === JSON.stringify(unique_data)
    );

    // Function is not currently queued
    if (i === -1) {
      const timeout = setTimeout(() => {
        func();
        this.cleanupRun(unique_data);
      }, duration);

      this.uniqueRuns.push({
        unique_data,
        timeout,
      });
      // Else reset function timer
    } else {
      this.logger.debug(
        `Debouncing function with data ${currentData[i].unique_data}`
      );
      clearTimeout(currentData[i].timeout);
      currentData[i].timeout = setTimeout(() => {
        func();
        this.cleanupRun(unique_data);
      }, duration);
    }
  }

  private cleanupRun(unique_data: any) {
    let i = this.uniqueRuns.findIndex(
      (x) => JSON.stringify(x.unique_data) === JSON.stringify(unique_data)
    );
    if (i === -1) return;

    this.uniqueRuns.splice(i, 1);
  }
}

const debouncer = new Debouncer();
export default debouncer;
