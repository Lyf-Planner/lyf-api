import rateLimit from "express-rate-limit";

export const nSecondLimiter = (n: number) =>
  rateLimit({
    windowMs: n * 1000, // n * 1000 where the window is n seconds
    limit: 1, // Requests per window
  });
