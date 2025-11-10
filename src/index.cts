import { initStorage } from "cloud-object-storage-lib";
import type MinioStorage from "cloud-object-storage-lib/libs/minio.js";

import { config } from "./env.cjs";
import { initDb, TMONGODB } from "./mongodb/db";

import type { TChatKitConfig } from "./interfaces.cjs";
import { consumeJSON, sendJSON } from "./redisq";

export class ChatKit {
  mongo?: TMONGODB;
  storage?: MinioStorage;
  options: TChatKitConfig = { verboseLabel: "INFO", verboseLevel: 30 };
  bootAt = new Date();
  redis?: {
    consumeJSON: (stream: string, group: string, handleEntry: (data: any) => Promise<void>) => Promise<void>;
    sendJSON: (stream: string, payload: Record<string, any>) => Promise<void>;
  }
  _initialized = false;
  constructor(options?: TChatKitConfig) {
    if (options?.verboseLabel) {
      this.options.verboseLabel =
        options.verboseLabel.toUpperCase() as TChatKitConfig["verboseLabel"];
    }
    if (this.options.verboseLabel !== "NONE")
      console.log(
        `Kit boot ${new Date().toISOString()} with verbose level: ${this.options.verboseLabel} (${this.options.verboseLevel})`
      );
  }
  public async init() {
    if (this._initialized) {
      throw new Error("Kit is already initialized");
    }

    if (config.mongodb) {
      this.mongo = await initDb(config.mongodb.uri, config.mongodb.options);
    }

    if (config.minio) {
      this.storage = initStorage(config.minio) as MinioStorage;
    }

    if (config.redis) {
      this.redis = {
        consumeJSON: (stream: string, group: string, handleEntry: (data: any) => Promise<void>) => consumeJSON(stream, group, handleEntry),
        sendJSON: (stream: string, payload: Record<string, any>) => sendJSON(stream, payload),
      }
    }
    this._initialized = true;
    console.log(
      `Kit initialized ${new Date().toISOString()} ELAPSED: ${this.timeElapsedInSeconds()}s`
    );
  }
  public timeElapsedInSeconds() {
    if (!this._initialized) {
      throw new Error("Kit is not initialized");
    }
    return (new Date().valueOf() - this.bootAt.valueOf()) / 1000;
  }
}
export const chatkit: InstanceType<typeof ChatKit> = new ChatKit();
