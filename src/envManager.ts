import dotenv from "dotenv";
dotenv.config();

// Expose this layer to access env vars throughout the app
const env = {
  nodeEnv: process.env.NODE_ENV,
  mongoUrl: process.env.MONGO_URL,
  mongoDb: process.env.MONGO_DB,
  jwtSecret: process.env.JWT_SECRET,
  //expoNotificationToken: process.env.EXPO_NOTIFICATION_TOKEN,
  port: process.env.PORT || 8000,
};

// Verify all required environment variables are included
const missingVars = Object.entries(env)
  .filter((x) => !x[1])
  .map((x) => x[0]);

if (missingVars.length > 0)
  throw new Error(`Missing environment variables: ${missingVars}`);

export default env;
