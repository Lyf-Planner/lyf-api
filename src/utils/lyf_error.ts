import { Logger } from '@/utils/logging';

export class LyfError extends Error {
  code: number;

  constructor(message: string, code: number) {
    super(message);
    this.code = code;

    this.hideInternalError(code);
  }

  private isInternalError(code: number) {
    return code >= 500;
  }

  private hideInternalError(code: number) {
    // a lot of the time we return the API error message to the user.
    // for internal errors, this often exposes sensitive information, hence is overidden.

    if (this.isInternalError(code)) {
      log.error(`API ${code} error occurred, overriding message`, { message: this.message });
      this.message = 'An internal server error occurred.';
    }
  }
}

const log = new Logger(LyfError.name);
