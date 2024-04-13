import dotenv from 'dotenv';
dotenv.config();

const VERSION = '2.2.4';

// Expose this layer to access env vars throughout the app
const env = {
  nodeEnv: process.env.NODE_ENV,
  mongoUrl: process.env.MONGO_URL,
  mongoDb: process.env.MONGO_DB,
  pgHost: process.env.PG_HOST,
  pgDb: process.env.PG_DB,
  pgUsername: process.env.PG_USERNAME,
  pgPassword: process.env.PG_PASSWORD,
  jwtSecret: process.env.JWT_SECRET,
  //expoNotificationToken: process.env.EXPO_NOTIFICATION_TOKEN,
  version: VERSION,
  port: process.env.PORT || 8000
};

// Verify all required environment variables are included
const missingVars = Object.entries(env)
  .filter((x) => !x[1])
  .map((x) => x[0]);

if (missingVars.length > 0)
  throw new Error(`Missing environment variables: ${missingVars}`);

export default env;
