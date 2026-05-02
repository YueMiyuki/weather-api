import { Redis } from "@upstash/redis";

// `Redis.fromEnv()` reads `UPSTASH_REDIS_REST_URL` and
// `UPSTASH_REDIS_REST_TOKEN` from the environment. Both are provided
// automatically when you connect an Upstash Redis database to a Vercel project.
export const redis = Redis.fromEnv();
