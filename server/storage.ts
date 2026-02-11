import {
  tokens,
  balances,
  positions,
  trades,
  agentConfigs,
  pnlSnapshots,
  agentEvents,
  users,
  type User,
  type UpsertUser,
  type Token,
  type InsertToken,
  type Balance,
  type InsertBalance,
  type Position,
  type InsertPosition,
  type Trade,
  type InsertTrade,
  type AgentConfig,
  type InsertAgentConfig,
  type PnlSnapshot,
  type InsertPnlSnapshot,
  type AgentEvent,
  type InsertAgentEvent,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, gte, sql } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  updateUser(id: string, updates: Partial<UpsertUser>): Promise<User | undefined>;

  // Tokens
  getTokens(): Promise<Token[]>;
  getToken(id: string): Promise<Token | undefined>;
  upsertToken(token: InsertToken): Promise<Token>;
  upsertTokens(tokenList: InsertToken[]): Promise<void>;

  // Balances
  getBalance(userId: string): Promise<Balance | undefined>;
  upsertBalance(balance: InsertBalance): Promise<Balance>;
  updateBalance(userId: string, amount: string): Promise<Balance | undefined>;
  claimFaucet(userId: string): Promise<Balance | undefined>;

  // Positions
  getPositions(userId: string, status?: string, isAgentTrade?: boolean): Promise<Position[]>;
  getPosition(id: string): Promise<Position | undefined>;
  createPosition(position: InsertPosition): Promise<Position>;
  updatePosition(id: string, updates: Partial<Position>): Promise<Position | undefined>;
  closePosition(id: string, realizedPnl: number): Promise<Position | undefined>;
  getAgentStats(userId: string): Promise<{ totalTrades: number; winTrades: number; totalProfit: number; openPositions: number }>;

  // Trades
  getTrades(userId: string): Promise<Trade[]>;
  createTrade(trade: InsertTrade): Promise<Trade>;

  // Agent Config
  getAgentConfig(userId: string): Promise<AgentConfig | undefined>;
  upsertAgentConfig(config: InsertAgentConfig): Promise<AgentConfig>;

  // PnL Snapshots
  getPnlSnapshots(userId: string, limit?: number): Promise<PnlSnapshot[]>;
  createPnlSnapshot(snapshot: InsertPnlSnapshot): Promise<PnlSnapshot>;

  // Agent Events
  getAgentEvents(userId: string, limit?: number): Promise<AgentEvent[]>;
  createAgentEvent(event: InsertAgentEvent): Promise<AgentEvent>;
}

export class DatabaseStorage implements IStorage {
  // Users
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async updateUser(id: string, updates: Partial<UpsertUser>): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  // Tokens
  async getTokens(): Promise<Token[]> {
    return db.select().from(tokens).orderBy(desc(tokens.marketCap));
  }

  async getToken(id: string): Promise<Token | undefined> {
    const [token] = await db.select().from(tokens).where(eq(tokens.id, id));
    return token;
  }

  async upsertToken(token: InsertToken): Promise<Token> {
    const [result] = await db
      .insert(tokens)
      .values(token)
      .onConflictDoUpdate({
        target: tokens.id,
        set: {
          ...token,
          lastUpdated: new Date(),
        },
      })
      .returning();
    return result;
  }

  async upsertTokens(tokenList: InsertToken[]): Promise<void> {
    if (tokenList.length === 0) return;
    
    for (const token of tokenList) {
      await db
        .insert(tokens)
        .values(token)
        .onConflictDoUpdate({
          target: tokens.id,
          set: {
            symbol: token.symbol,
            name: token.name,
            image: token.image,
            currentPrice: token.currentPrice,
            priceChange24h: token.priceChange24h,
            volume24h: token.volume24h,
            marketCap: token.marketCap,
            isPinned: token.isPinned,
            lastUpdated: new Date(),
          },
        });
    }
  }

  // Balances
  async getBalance(userId: string): Promise<Balance | undefined> {
    const [balance] = await db.select().from(balances).where(eq(balances.userId, userId));
    return balance;
  }

  async upsertBalance(balance: InsertBalance): Promise<Balance> {
    // First check if user already has a balance
    const existing = await this.getBalance(balance.userId);
    if (existing) {
      return existing;
    }
    
    const [result] = await db
      .insert(balances)
      .values({
        userId: balance.userId,
        amount: balance.amount || "0",
      })
      .returning();
    return result;
  }

  async updateBalance(userId: string, amount: string): Promise<Balance | undefined> {
    const [result] = await db
      .update(balances)
      .set({ amount })
      .where(eq(balances.userId, userId))
      .returning();
    return result;
  }

  async claimFaucet(userId: string): Promise<Balance | undefined> {
    const existing = await this.getBalance(userId);
    const now = new Date();

    if (!existing) {
      const [result] = await db
        .insert(balances)
        .values({
          userId,
          amount: "10000",
          lastFaucetClaim: now,
        })
        .returning();
      return result;
    }

    // Check cooldown (24 hours)
    if (existing.lastFaucetClaim) {
      const cooldownEnd = new Date(existing.lastFaucetClaim.getTime() + 24 * 60 * 60 * 1000);
      if (now < cooldownEnd) {
        throw new Error("Faucet cooldown not expired");
      }
    }

    const newAmount = (parseFloat(existing.amount) + 10000).toString();
    const [result] = await db
      .update(balances)
      .set({ amount: newAmount, lastFaucetClaim: now })
      .where(eq(balances.userId, userId))
      .returning();
    return result;
  }

  // Positions
  async getPositions(userId: string, status?: string, isAgentTrade?: boolean): Promise<Position[]> {
    const conditions = [eq(positions.userId, userId)];
    if (status) {
      conditions.push(eq(positions.status, status));
    }
    if (isAgentTrade !== undefined) {
      conditions.push(eq(positions.isAgentTrade, isAgentTrade));
    }
    return db
      .select()
      .from(positions)
      .where(and(...conditions))
      .orderBy(desc(positions.createdAt));
  }

  async getPosition(id: string): Promise<Position | undefined> {
    const [position] = await db.select().from(positions).where(eq(positions.id, id));
    return position;
  }

  async createPosition(position: InsertPosition): Promise<Position> {
    const [result] = await db.insert(positions).values(position).returning();
    return result;
  }

  async updatePosition(id: string, updates: Partial<Position>): Promise<Position | undefined> {
    const [result] = await db
      .update(positions)
      .set(updates)
      .where(eq(positions.id, id))
      .returning();
    return result;
  }

  async closePosition(id: string, realizedPnl: number): Promise<Position | undefined> {
    const [result] = await db
      .update(positions)
      .set({
        status: "closed",
        closedAt: new Date(),
        realizedPnl: realizedPnl.toString(),
        unrealizedPnl: "0",
      })
      .where(eq(positions.id, id))
      .returning();
    return result;
  }

  async getAgentStats(userId: string): Promise<{ totalTrades: number; winTrades: number; totalProfit: number; openPositions: number }> {
    // Get all closed agent positions
    const closedAgentPositions = await db
      .select()
      .from(positions)
      .where(and(
        eq(positions.userId, userId),
        eq(positions.isAgentTrade, true),
        eq(positions.status, "closed")
      ));
    
    // Get open agent positions
    const openAgentPositions = await db
      .select()
      .from(positions)
      .where(and(
        eq(positions.userId, userId),
        eq(positions.isAgentTrade, true),
        eq(positions.status, "open")
      ));

    const totalTrades = closedAgentPositions.length;
    const winTrades = closedAgentPositions.filter(p => parseFloat(p.realizedPnl || "0") > 0).length;
    const totalProfit = closedAgentPositions.reduce((sum, p) => sum + parseFloat(p.realizedPnl || "0"), 0);
    
    return {
      totalTrades,
      winTrades,
      totalProfit,
      openPositions: openAgentPositions.length,
    };
  }

  // Trades
  async getTrades(userId: string): Promise<Trade[]> {
    return db
      .select()
      .from(trades)
      .where(eq(trades.userId, userId))
      .orderBy(desc(trades.createdAt));
  }

  async createTrade(trade: InsertTrade): Promise<Trade> {
    const [result] = await db.insert(trades).values(trade).returning();
    return result;
  }

  // Agent Config
  async getAgentConfig(userId: string): Promise<AgentConfig | undefined> {
    const [config] = await db.select().from(agentConfigs).where(eq(agentConfigs.userId, userId));
    return config;
  }

  async upsertAgentConfig(config: InsertAgentConfig): Promise<AgentConfig> {
    const existing = await this.getAgentConfig(config.userId);
    
    if (existing) {
      const updateData: any = {
        updatedAt: new Date(),
      };
      
      if (config.allowedPairs !== undefined) updateData.allowedPairs = config.allowedPairs;
      if (config.maxCapital !== undefined) updateData.maxCapital = config.maxCapital;
      if (config.maxLeverage !== undefined) updateData.maxLeverage = config.maxLeverage;
      if (config.maxLossPerDay !== undefined) updateData.maxLossPerDay = config.maxLossPerDay;
      if (config.maxOpenPositions !== undefined) updateData.maxOpenPositions = config.maxOpenPositions;
      if (config.tradeFrequencyMinutes !== undefined) updateData.tradeFrequencyMinutes = config.tradeFrequencyMinutes;
      if (config.strategy !== undefined) updateData.strategy = config.strategy;
      if (config.useEmaFilter !== undefined) updateData.useEmaFilter = config.useEmaFilter;
      if (config.useRsiFilter !== undefined) updateData.useRsiFilter = config.useRsiFilter;
      if (config.useVolatilityFilter !== undefined) updateData.useVolatilityFilter = config.useVolatilityFilter;
      if (config.status !== undefined) updateData.status = config.status;
      
      const [result] = await db
        .update(agentConfigs)
        .set(updateData)
        .where(eq(agentConfigs.userId, config.userId))
        .returning();
      return result;
    }

    const insertData: any = {
      userId: config.userId,
      allowedPairs: config.allowedPairs || [],
      maxCapital: config.maxCapital || "1000",
      maxLeverage: config.maxLeverage || 5,
      maxLossPerDay: config.maxLossPerDay || "100",
      maxOpenPositions: config.maxOpenPositions || 3,
      tradeFrequencyMinutes: config.tradeFrequencyMinutes || 30,
      strategy: config.strategy || "trend",
      useEmaFilter: config.useEmaFilter ?? true,
      useRsiFilter: config.useRsiFilter ?? true,
      useVolatilityFilter: config.useVolatilityFilter ?? false,
      status: config.status || "paused",
    };

    const [result] = await db
      .insert(agentConfigs)
      .values(insertData)
      .returning();
    return result;
  }

  async getRunningAgentConfigs(): Promise<AgentConfig[]> {
    return db.select().from(agentConfigs).where(eq(agentConfigs.status, "running"));
  }

  async updateAgentLastRun(userId: string): Promise<void> {
    await db
      .update(agentConfigs)
      .set({ lastRunAt: new Date() })
      .where(eq(agentConfigs.userId, userId));
  }

  // PnL Snapshots
  async getPnlSnapshots(userId: string, limit = 30): Promise<PnlSnapshot[]> {
    return db
      .select()
      .from(pnlSnapshots)
      .where(eq(pnlSnapshots.userId, userId))
      .orderBy(desc(pnlSnapshots.createdAt))
      .limit(limit);
  }

  async createPnlSnapshot(snapshot: InsertPnlSnapshot): Promise<PnlSnapshot> {
    const [result] = await db.insert(pnlSnapshots).values(snapshot).returning();
    return result;
  }

  // Agent Events
  async getAgentEvents(userId: string, limit = 20): Promise<AgentEvent[]> {
    return db
      .select()
      .from(agentEvents)
      .where(eq(agentEvents.userId, userId))
      .orderBy(desc(agentEvents.createdAt))
      .limit(limit);
  }

  async createAgentEvent(event: InsertAgentEvent): Promise<AgentEvent> {
    const [result] = await db.insert(agentEvents).values(event).returning();
    return result;
  }
}

export const storage = new DatabaseStorage();
