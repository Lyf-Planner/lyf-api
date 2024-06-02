import { Response } from 'express';
import rateLimit from 'express-rate-limit';

export type InclusionString = { include: string }

export const nSecondLimiter = (n: number, requests = 1) =>
  rateLimit({
    windowMs: n * 1000, // n * 1000 where the window is n seconds
    limit: requests // Requests per window
  });

export const getMiddlewareVars = (res: Response) => {
  return res.locals;
};
