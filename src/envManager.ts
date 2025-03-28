import dotenv from 'dotenv';

import { LyfError } from './utils/lyf_error';
dotenv.config();

const VERSION = '3.0.0-beta.1';

// Expose this layer to access env vars throughout the app
const env = {
  jwtSecret: process.env.JWT_SECRET,
  mongoUrl: process.env.MONGO_URL,
  mongoDb: process.env.MONGO_DB,
  nodeEnv: process.env.NODE_ENV,
  openWeatherApiKey: process.env.OPEN_WEATHER_API_KEY,
  pgConnectionUrl: process.env.PG_CONNECTION_URL,
  // expoNotificationToken: process.env.EXPO_NOTIFICATION_TOKEN,
  version: VERSION,
  port: process.env.PORT || 8000
};

// Verify all required environment variables are included
const missingVars = Object.entries(env)
  .filter((x) => !x[1])
  .map((x) => x[0]);

if (missingVars.length > 0) {
  throw new LyfError(`Missing environment variables: ${missingVars}`, 500);
}

export default env;
