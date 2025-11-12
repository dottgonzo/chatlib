import { IConnectionParams } from "./interfaces.cjs";




export const config: IConnectionParams = {
  supabase: process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
    ? {
      url: process.env.SUPABASE_URL,
      serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
      schema: process.env.SUPABASE_SCHEMA === "public" ? "public" : undefined,
    }
    : undefined,




};
