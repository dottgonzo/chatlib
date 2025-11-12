import { IConnectionParams } from "./interfaces.cjs";


export function getConfig(env: any): IConnectionParams {
  return {
    supabase: env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY
      ? {
        url: env.SUPABASE_URL,
        serviceRoleKey: env.SUPABASE_SERVICE_ROLE_KEY,
        schema: env.SUPABASE_SCHEMA === "public" ? "public" : undefined,
      }
      : undefined,
  };
}


