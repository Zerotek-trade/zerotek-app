import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, decimal, integer, boolean, jsonb, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Re-export auth models
export * from "./models/auth";

// Tokens table - cached from CoinGecko
export const tokens = pgTable("tokens", {
  id: varchar("id", { length: 100 }).primaryKey(),
  symbol: varchar("symbol", { length: 20 }).notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  image: text("image"),
  currentPrice: decimal("current_price", { precision: 20, scale: 8 }),
  priceChange24h: decimal("price_change_24h", { precision: 10, scale: 4 }),
  volume24h: decimal("volume_24h", { precision: 20, scale: 2 }),
  marketCap: decimal("market_cap", { precision: 20, scale: 2 }),
  isPinned: boolean("is_pinned").default(false),
  lastUpdated: timestamp("last_updated").defaultNow(),
});

export const insertTokenSchema = createInsertSchema(tokens);
export type InsertToken = z.infer<typeof insertTokenSchema>;
export type Token = typeof tokens.$inferSelect;

// User balances
export const balances = pgTable("balances", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  amount: decimal("amount", { precision: 20, scale: 8 }).notNull().default("0"),
  lastFaucetClaim: timestamp("last_faucet_claim"),
}, (table) => [index("balances_user_id_idx").on(table.userId)]);

export const insertBalanceSchema = createInsertSchema(balances);
export type InsertBalance = z.infer<typeof insertBalanceSchema>;
export type Balance = typeof balances.$inferSelect;

// Positions
export const positions = pgTable("positions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  tokenId: varchar("token_id").notNull(),
  side: varchar("side", { length: 10 }).notNull(), // 'long' or 'short'
  entryPrice: decimal("entry_price", { precision: 20, scale: 8 }).notNull(),
  quantity: decimal("quantity", { precision: 20, scale: 8 }).notNull(),
  leverage: integer("leverage").notNull().default(1),
  margin: decimal("margin", { precision: 20, scale: 8 }).notNull(),
  liquidationPrice: decimal("liquidation_price", { precision: 20, scale: 8 }),
  takeProfit: decimal("take_profit", { precision: 20, scale: 8 }),
  stopLoss: decimal("stop_loss", { precision: 20, scale: 8 }),
  limitClosePrice: decimal("limit_close_price", { precision: 20, scale: 8 }),
  unrealizedPnl: decimal("unrealized_pnl", { precision: 20, scale: 8 }).default("0"),
  isAgentTrade: boolean("is_agent_trade").default(false), // true = opened by agent, false = opened by user
  realizedPnl: decimal("realized_pnl", { precision: 20, scale: 8 }), // PnL when closed
  status: varchar("status", { length: 20 }).notNull().default("open"), // 'open', 'closed', 'liquidated'
  createdAt: timestamp("created_at").defaultNow(),
  closedAt: timestamp("closed_at"),
}, (table) => [
  index("positions_user_id_idx").on(table.userId),
  index("positions_status_idx").on(table.status),
  index("positions_is_agent_idx").on(table.isAgentTrade),
]);

export const insertPositionSchema = createInsertSchema(positions);
export type InsertPosition = z.infer<typeof insertPositionSchema>;
export type Position = typeof positions.$inferSelect;

// Trades / Order fills
export const trades = pgTable("trades", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  positionId: varchar("position_id"),
  tokenId: varchar("token_id").notNull(),
  side: varchar("side", { length: 10 }).notNull(), // 'buy' or 'sell'
  type: varchar("type", { length: 20 }).notNull().default("market"), // 'market', 'limit'
  price: decimal("price", { precision: 20, scale: 8 }).notNull(),
  quantity: decimal("quantity", { precision: 20, scale: 8 }).notNull(),
  fee: decimal("fee", { precision: 20, scale: 8 }).default("0"),
  realizedPnl: decimal("realized_pnl", { precision: 20, scale: 8 }),
  isAgentTrade: boolean("is_agent_trade").default(false), // true = executed by agent
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("trades_user_id_idx").on(table.userId),
  index("trades_token_id_idx").on(table.tokenId),
  index("trades_is_agent_idx").on(table.isAgentTrade),
]);

export const insertTradeSchema = createInsertSchema(trades);
export type InsertTrade = z.infer<typeof insertTradeSchema>;
export type Trade = typeof trades.$inferSelect;

// Agent configurations
export const agentConfigs = pgTable("agent_configs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().unique(),
  allowedPairs: jsonb("allowed_pairs").$type<string[]>().default(["ton", "jup", "pyth", "pump"]),
  maxCapital: decimal("max_capital", { precision: 20, scale: 8 }).default("1000"),
  maxLeverage: integer("max_leverage").default(5),
  maxLossPerDay: decimal("max_loss_per_day", { precision: 20, scale: 8 }).default("100"),
  maxOpenPositions: integer("max_open_positions").default(3),
  tradeFrequencyMinutes: integer("trade_frequency_minutes").default(30),
  strategy: varchar("strategy", { length: 50 }).default("trend"), // 'trend', 'breakout', 'mean_reversion'
  useEmaFilter: boolean("use_ema_filter").default(true),
  useRsiFilter: boolean("use_rsi_filter").default(true),
  useVolatilityFilter: boolean("use_volatility_filter").default(false),
  maxMarginPerTrade: decimal("max_margin_per_trade", { precision: 20, scale: 8 }).default("300"), // max margin for single trade
  useRandomMargin: boolean("use_random_margin").default(true), // true = random (100, 250, 300), false = fixed maxMarginPerTrade
  status: varchar("status", { length: 20 }).default("paused"), // 'running', 'paused'
  lastRunAt: timestamp("last_run_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [index("agent_configs_user_id_idx").on(table.userId)]);

export const insertAgentConfigSchema = createInsertSchema(agentConfigs);
export type InsertAgentConfig = z.infer<typeof insertAgentConfigSchema>;
export type AgentConfig = typeof agentConfigs.$inferSelect;

// PnL snapshots for equity curve
export const pnlSnapshots = pgTable("pnl_snapshots", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  equity: decimal("equity", { precision: 20, scale: 8 }).notNull(),
  dailyPnl: decimal("daily_pnl", { precision: 20, scale: 8 }).default("0"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [index("pnl_snapshots_user_id_idx").on(table.userId)]);

export const insertPnlSnapshotSchema = createInsertSchema(pnlSnapshots);
export type InsertPnlSnapshot = z.infer<typeof insertPnlSnapshotSchema>;
export type PnlSnapshot = typeof pnlSnapshots.$inferSelect;

// Agent events for activity feed
export const agentEvents = pgTable("agent_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  agentId: varchar("agent_id"),
  type: varchar("type", { length: 50 }).notNull(), // 'position_opened', 'position_closed', 'tp_hit', 'sl_hit', 'liquidated'
  symbol: varchar("symbol", { length: 20 }),
  message: text("message").notNull(),
  metaJson: jsonb("meta_json").$type<Record<string, any>>(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [index("agent_events_user_id_idx").on(table.userId)]);

export const insertAgentEventSchema = createInsertSchema(agentEvents);
export type InsertAgentEvent = z.infer<typeof insertAgentEventSchema>;
export type AgentEvent = typeof agentEvents.$inferSelect;
