import type { TStorageConfig } from "cloud-object-storage-lib/interfaces";
import type { ConnectOptions } from "mongoose";
import type { createClient } from "redis";

export type TMongoDBConnection = {
  uri: string;
  options?: ConnectOptions;
};

export type TRedisConfig = {
  client: ReturnType<typeof createClient>;
  consumer: string;
  PROCESSING_TIMEOUT_MS: number;
  CLAIM_MIN_IDLE_MS: number;
  READ_BLOCK_MS: number;
  BATCH: number;
};



export interface IConnectionParams {
  mongodb?: TMongoDBConnection;
  minio?: TStorageConfig;

  redis?: TRedisConfig;
}

// to be merged with blueconv



export type TChatKitConfig = {
  verboseLevel?: number;
  verboseLabel?:
  | "INFO"
  | "DEBUG"
  | "ERROR"
  | "WARN"
  | "FATAL"
  | "TRACE"
  | "NONE";
};

