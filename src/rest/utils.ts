import rateLimit from "express-rate-limit";

export const nSecondLimiter = (n: number, requests = 1) =>
  rateLimit({
    windowMs: n * 1000, // n * 1000 where the window is n seconds
    limit: requests, // Requests per window
  });
