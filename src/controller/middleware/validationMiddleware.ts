import { NextFunction, Request, Response } from "express";
import { ValidationChain, validationResult } from "express-validator";
import { checkExact } from "express-validator";
import { Logger } from "../../utils/logging";

const logger = new Logger("ValidationMiddleware");

export const validate = (validations: ValidationChain[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    await checkExact(validations).run(req);

    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }

    logger.error(
      `Malformed request: ${errors.array().map((x) => JSON.stringify(x))}`
    );
    res.status(400).json({ errors: errors.array() });
  };
};
