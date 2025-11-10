import initMongo from "nodemongooselib";
import type { ConnectOptions } from "mongoose";


import members from "./members";




export type TMONGODB = {

  members: typeof members;

};

export async function initDb(uri: string, options?: ConnectOptions) {
  await initMongo({ uri, options });
  const db: TMONGODB = {

    members,

  };
  return db;
}
