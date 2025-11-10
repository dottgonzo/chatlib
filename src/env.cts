import { IConnectionParams } from "./interfaces.cjs";
import { createClient } from "redis";




export const config: IConnectionParams = {
  mongodb: process.env.MONGODB_URI
    ? {
      uri: process.env.MONGODB_URI || "mongodb://localhost:27017/mydb",
    }
    : undefined,

  minio: process.env.MINIO_URI
    ? {
      type: "minio",
      endPoint: process.env.MINIO_URI || "localhost",
      port: parseInt(process.env.MINIO_PORT || "9000", 10),
      useSSL: process.env.MINIO_USE_SSL === "true",
      accessKey: process.env.MINIO_ACCESS_KEY || "minioadmin",
      secretKey: process.env.MINIO_SECRET_KEY || "minioadmin",
    }
    : undefined,


  redis: process.env.REDIS_URL
    ? {
      client: createClient({ url: process.env.REDIS_URL || "redis://localhost:6379" }),
      consumer: process.env.CONSUMER || `c-${Math.random().toString(36).slice(2, 8)}-${Date.now()}`,
      PROCESSING_TIMEOUT_MS: Number(process.env.PROCESSING_TIMEOUT_MS || 30_000),
      CLAIM_MIN_IDLE_MS: Number(process.env.CLAIM_MIN_IDLE_MS || 60_000),
      READ_BLOCK_MS: Number(process.env.READ_BLOCK_MS || 15_000),
      BATCH: Number(process.env.BATCH || 10),
    }

    : undefined,
};
