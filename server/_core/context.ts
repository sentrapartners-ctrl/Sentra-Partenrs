import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { COOKIE_NAME } from "@shared/const";
import { verifyToken, getUserById } from "../auth";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;

  try {
    // Get token from cookie
    const token = opts.req.cookies?.[COOKIE_NAME];
    
    if (token) {
      // Verify token
      const payload = await verifyToken(token);
      
      if (payload) {
        // Get user from database
        user = await getUserById(payload.userId);
      }
    }
  } catch (error) {
    // Authentication is optional for public procedures.
    console.error('[Context] Authentication error:', error);
    user = null;
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}

