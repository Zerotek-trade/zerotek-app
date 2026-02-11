import { Request, Response, NextFunction } from "express";
import { PrivyClient as NodePrivyClient } from "@privy-io/node";
import { PrivyClient as ServerAuthPrivyClient } from "@privy-io/server-auth";
import { db } from "../db";
import { users } from "@shared/models/auth";
import { eq, and } from "drizzle-orm";

function getPrivyEnvVars() {
  const appId = process.env.VITE_PRIVY_APP_ID || "";
  const appSecret = process.env.PRIVY_APP_SECRET || "";
  return { appId, appSecret };
}

function logPrivyConfig() {
  const { appId, appSecret } = getPrivyEnvVars();
  console.log("[Privy Auth] Configuration loaded:");
  console.log("  VITE_PRIVY_APP_ID:", appId ? appId.substring(0, 6) + "..." : "NOT SET");
  console.log("  PRIVY_APP_SECRET:", appSecret ? "****" + appSecret.substring(appSecret.length - 4) : "NOT SET");
  console.log("  App ID length:", appId.length);
  console.log("  Secret length:", appSecret.length);
}

logPrivyConfig();

function createNodeClient(): NodePrivyClient {
  const { appId, appSecret } = getPrivyEnvVars();
  
  if (!appId || !appSecret) {
    throw new Error("Privy configuration missing - VITE_PRIVY_APP_ID or PRIVY_APP_SECRET not set");
  }
  
  return new NodePrivyClient({
    appId: appId,
    appSecret: appSecret,
  });
}

function createServerAuthClient(): ServerAuthPrivyClient {
  const { appId, appSecret } = getPrivyEnvVars();
  
  if (!appId || !appSecret) {
    throw new Error("Privy configuration missing - VITE_PRIVY_APP_ID or PRIVY_APP_SECRET not set");
  }
  
  return new ServerAuthPrivyClient(appId, appSecret);
}

export async function checkPrivyHealth(): Promise<{ ok: boolean; error?: string; details?: any }> {
  try {
    const { appId, appSecret } = getPrivyEnvVars();
    
    if (!appId) {
      return { ok: false, error: "VITE_PRIVY_APP_ID not set" };
    }
    if (!appSecret) {
      return { ok: false, error: "PRIVY_APP_SECRET not set" };
    }
    
    const client = createServerAuthClient();
    
    return { 
      ok: true, 
      details: {
        appIdPrefix: appId.substring(0, 6),
        secretConfigured: true,
        appIdLength: appId.length,
        secretLength: appSecret.length,
      }
    };
  } catch (error: any) {
    return { ok: false, error: error.message };
  }
}

export interface PrivyAuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string | null;
    privyUserId: string;
  };
}

async function getOrCreateUser(privyUserId: string, email: string | null): Promise<string> {
  const existing = await db
    .select()
    .from(users)
    .where(
      and(
        eq(users.authProvider, "privy"),
        eq(users.providerUserId, privyUserId)
      )
    )
    .limit(1);

  if (existing.length > 0) {
    if (email && existing[0].email !== email) {
      await db
        .update(users)
        .set({ email, updatedAt: new Date() })
        .where(eq(users.id, existing[0].id));
    }
    return existing[0].id;
  }

  const [newUser] = await db
    .insert(users)
    .values({
      email,
      authProvider: "privy",
      providerUserId: privyUserId,
    })
    .returning({ id: users.id });

  return newUser.id;
}

export async function isPrivyAuthenticated(
  req: PrivyAuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized: No token provided" });
  }

  const token = authHeader.substring(7);
  const { appId } = getPrivyEnvVars();
  
  try {
    // Try server-auth package first (simpler API)
    const serverAuthClient = createServerAuthClient();
    
    console.log("[Privy Auth] Verifying token with server-auth...");
    console.log("[Privy Auth] Using App ID:", appId.substring(0, 6) + "...");
    console.log("[Privy Auth] Token (first 30):", token.substring(0, 30) + "...");
    
    const verifiedClaims = await serverAuthClient.verifyAuthToken(token);
    
    console.log("[Privy Auth] Token verified successfully for user:", verifiedClaims.userId);
    
    const privyUserId = verifiedClaims.userId;
    
    let email: string | null = null;
    try {
      const nodeClient = createNodeClient();
      const privyUser = await nodeClient.users().get({ id: privyUserId });
      const emailLinked = privyUser.linked_accounts?.find((a: any) => a.type === "email");
      email = emailLinked?.address || null;
    } catch {
    }

    const internalUserId = await getOrCreateUser(privyUserId, email);

    req.user = {
      id: internalUserId,
      email,
      privyUserId,
    };

    next();
  } catch (error: any) {
    const { appId, appSecret } = getPrivyEnvVars();
    console.error("[Privy Auth] Verification failed:", error.message);
    console.error("[Privy Auth] Error name:", error.name);
    console.error("[Privy Auth] Full error:", JSON.stringify(error, Object.getOwnPropertyNames(error)));
    console.error("[Privy Auth] App ID:", appId.substring(0, 6) + "... (length: " + appId.length + ")");
    console.error("[Privy Auth] Secret configured: length", appSecret.length);
    console.error("[Privy Auth] Token prefix:", token.substring(0, 30) + "...");
    
    // Decode JWT header and payload (not signature) for debugging
    try {
      const parts = token.split('.');
      if (parts.length === 3) {
        const header = JSON.parse(Buffer.from(parts[0], 'base64url').toString());
        const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString());
        console.error("[Privy Auth] Token header:", JSON.stringify(header));
        console.error("[Privy Auth] Token payload (aud, iss, sub):", {
          aud: payload.aud,
          iss: payload.iss,
          sub: payload.sub?.substring(0, 20),
          exp: payload.exp,
          iat: payload.iat,
        });
      }
    } catch (decodeError) {
      console.error("[Privy Auth] Could not decode token for debugging");
    }
    
    return res.status(401).json({ message: "Unauthorized: Invalid token" });
  }
}

export async function optionalPrivyAuth(
  req: PrivyAuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return next();
    }

    const token = authHeader.substring(7);
    
    let serverAuthClient: ServerAuthPrivyClient;
    try {
      serverAuthClient = createServerAuthClient();
    } catch {
      return next();
    }
    
    const verifiedClaims = await serverAuthClient.verifyAuthToken(token);
    const privyUserId = verifiedClaims.userId;
    
    let email: string | null = null;
    try {
      const nodeClient = createNodeClient();
      const privyUser = await nodeClient.users().get({ id: privyUserId });
      const emailLinked = privyUser.linked_accounts?.find((a: any) => a.type === "email");
      email = emailLinked?.address || null;
    } catch {
    }

    const internalUserId = await getOrCreateUser(privyUserId, email);

    req.user = {
      id: internalUserId,
      email,
      privyUserId,
    };

    next();
  } catch {
    next();
  }
}
