import initMongo from "nodemongooselib";
import type { ConnectOptions } from "mongoose";


import members from "./members";
import agents from "./agents";
import conversations from "./conversations";
import messages from "./messages";
import studio from "./studio";



export type TMONGODB = {

  members: typeof members;
  agents: typeof agents;
  conversations: typeof conversations;
  messages: typeof messages;
  studio: typeof studio;
};

export async function initDb(uri: string, options?: ConnectOptions) {
  await initMongo({ uri, options });
  const db: TMONGODB = {

    members,
    agents,
    conversations,
    messages,
    studio,
  };
  return db;
}
