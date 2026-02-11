import type { Express } from "express";
import { createServer, type Server } from "http";
import { isPrivyAuthenticated, PrivyAuthenticatedRequest, checkPrivyHealth } from "./middleware/privyAuth";
import { storage } from "./storage";
import { fetchTopTokens, fetchCandles, calculateIndicators, fetchTokenPrice, fetchBatchPrices, updateBatchPriceCache, type Timeframe } from "./services/priceService";
import { fetchCryptoNews } from "./services/newsService";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // ==================== Health Check Routes ====================
  
  app.get("/api/health/privy", async (req, res) => {
    try {
      const health = await checkPrivyHealth();
      res.json(health);
    } catch (error: any) {
      res.status(500).json({ ok: false, error: error.message });
    }
  });

  // ==================== Token Routes ====================
  
  // Get all tokens
  app.get("/api/tokens", async (req, res) => {
    try {
      const tokens = await fetchTopTokens();
      // Update batch price cache with fresh token prices for position PnL calculations
      updateBatchPriceCache(tokens.map(t => ({
        id: t.id,
        currentPrice: t.currentPrice,
        priceChange24h: t.priceChange24h,
      })));
      res.json(tokens);
    } catch (error: any) {
      console.error("Failed to fetch tokens:", error);
      res.status(500).json({ message: "Failed to fetch tokens" });
    }
  });

  // ==================== News Routes ====================
  
  // Get crypto news feed
  app.get("/api/news", async (req, res) => {
    try {
      const news = await fetchCryptoNews();
      res.json(news);
    } catch (error: any) {
      console.error("Failed to fetch news:", error);
      res.status(500).json({ message: "Failed to fetch news" });
    }
  });

  // ==================== Dashboard Route ====================
  
  app.get("/api/dashboard", isPrivyAuthenticated, async (req: PrivyAuthenticatedRequest, res) => {
    try {
      const userId = req.user!.id;

      // Get or create user balance
      let balance = await storage.getBalance(userId);
      if (!balance) {
        // Create initial balance for new users
        balance = await storage.upsertBalance({
          userId,
          amount: "0",
        });
      }

      // Get open positions - all, agent, and manual
      const openPositions = await storage.getPositions(userId, "open");
      const agentPositions = openPositions.filter(p => p.isAgentTrade);
      const manualPositions = openPositions.filter(p => !p.isAgentTrade);

      // Get recent trades
      const allTrades = await storage.getTrades(userId);
      const recentTrades = allTrades.slice(0, 10);

      // Get agent config
      const agentConfig = await storage.getAgentConfig(userId);

      // Get PnL snapshots for equity curve
      const snapshots = await storage.getPnlSnapshots(userId, 30);

      // Fetch current prices for all tokens with open positions using batch fetch (faster)
      const tokenIds = Array.from(new Set(openPositions.map(p => p.tokenId)));
      const batchPrices = await fetchBatchPrices(tokenIds);
      const tokenPrices: Record<string, number> = {};
      
      for (const tokenId of tokenIds) {
        if (batchPrices[tokenId] && batchPrices[tokenId].price > 0) {
          tokenPrices[tokenId] = batchPrices[tokenId].price;
        } else {
          // Fallback to cached price
          const cachedToken = await storage.getToken(tokenId);
          if (cachedToken?.currentPrice) {
            tokenPrices[tokenId] = parseFloat(cachedToken.currentPrice);
          }
        }
      }

      // Calculate live unrealized PnL for each position
      const calculatePositionPnl = (position: typeof openPositions[0]) => {
        const currentPrice = tokenPrices[position.tokenId];
        if (!currentPrice) return 0;
        
        const entryPrice = parseFloat(position.entryPrice);
        const quantity = parseFloat(position.quantity);
        
        // Calculate PnL based on side (long = profit when price goes up, short = profit when price goes down)
        // Note: quantity already reflects leveraged position size, so PnL is calculated on full position
        if (position.side === "long") {
          return (currentPrice - entryPrice) * quantity;
        } else if (position.side === "short") {
          return (entryPrice - currentPrice) * quantity;
        }
        return 0;
      };

      // Calculate metrics with live prices
      const balanceAmount = parseFloat(balance.amount);
      const unrealizedPnl = openPositions.reduce(
        (sum, p) => sum + calculatePositionPnl(p),
        0
      );
      const agentUnrealizedPnl = agentPositions.reduce(
        (sum, p) => sum + calculatePositionPnl(p),
        0
      );
      const manualUnrealizedPnl = manualPositions.reduce(
        (sum, p) => sum + calculatePositionPnl(p),
        0
      );
      const equity = balanceAmount + unrealizedPnl;

      // Calculate realized PnL from closed positions today
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayTrades = allTrades.filter(
        (t) => new Date(t.createdAt!) >= todayStart && t.realizedPnl
      );
      const todayPnl = todayTrades.reduce(
        (sum, t) => sum + parseFloat(t.realizedPnl || "0"),
        0
      );

      // Calculate win rate
      const closedTrades = allTrades.filter((t) => t.realizedPnl);
      const winningTrades = closedTrades.filter(
        (t) => parseFloat(t.realizedPnl || "0") > 0
      );
      const winRate = closedTrades.length > 0 ? winningTrades.length / closedTrades.length : 0;

      // Calculate max drawdown from snapshots
      let maxDrawdown = 0;
      if (snapshots.length > 0) {
        let peak = parseFloat(snapshots[snapshots.length - 1].equity);
        for (let i = snapshots.length - 1; i >= 0; i--) {
          const eq = parseFloat(snapshots[i].equity);
          if (eq > peak) peak = eq;
          const drawdown = (peak - eq) / peak;
          if (drawdown > maxDrawdown) maxDrawdown = drawdown;
        }
      }

      // Calculate faucet cooldown
      let canClaimFaucet = true;
      let faucetCooldown = null;
      if (balance.lastFaucetClaim) {
        const cooldownEnd = new Date(
          new Date(balance.lastFaucetClaim).getTime() + 24 * 60 * 60 * 1000
        );
        if (new Date() < cooldownEnd) {
          canClaimFaucet = false;
          faucetCooldown = cooldownEnd.getTime() - Date.now();
        }
      }

      // Create daily PnL snapshot if needed (once per day)
      const lastSnapshot = snapshots[0];
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const shouldCreateSnapshot = !lastSnapshot || 
        new Date(lastSnapshot.createdAt!).setHours(0, 0, 0, 0) < today.getTime();
      
      let allSnapshots = [...snapshots];
      if (shouldCreateSnapshot && equity > 0) {
        const newSnapshot = await storage.createPnlSnapshot({
          userId,
          equity: equity.toString(),
          dailyPnl: todayPnl.toString(),
        });
        allSnapshots = [newSnapshot, ...snapshots];
      }

      res.json({
        balance: balanceAmount,
        equity,
        unrealizedPnl,
        realizedPnl: allTrades.reduce(
          (sum, t) => sum + parseFloat(t.realizedPnl || "0"),
          0
        ),
        todayPnl,
        winRate,
        maxDrawdown,
        openPositions: openPositions.length,
        agentPositions: agentPositions.length,
        agentUnrealizedPnl,
        manualPositions: manualPositions.length,
        manualUnrealizedPnl,
        agentStatus: agentConfig?.status || "paused",
        canClaimFaucet,
        faucetCooldown,
        equityCurve: allSnapshots
          .reverse()
          .map((s) => ({
            date: new Date(s.createdAt!).toLocaleDateString(),
            equity: parseFloat(s.equity),
          })),
        recentTrades,
      });
    } catch (error: any) {
      console.error("Dashboard error:", error);
      res.status(500).json({ message: "Failed to load dashboard" });
    }
  });

  // ==================== Faucet Routes ====================
  
  // Faucet status endpoint
  app.get("/api/faucet/status", isPrivyAuthenticated, async (req: PrivyAuthenticatedRequest, res) => {
    try {
      const userId = req.user!.id;
      
      // Get or create user balance
      let balance = await storage.getBalance(userId);
      if (!balance) {
        balance = await storage.upsertBalance({
          userId,
          amount: "0",
        });
      }

      const balanceAmount = parseFloat(balance.amount);
      const now = Date.now();
      const lastClaimAt = balance.lastFaucetClaim
        ? new Date(balance.lastFaucetClaim).getTime()
        : 0;
      const cooldownMs = 24 * 60 * 60 * 1000;
      const canClaimFaucet = now - lastClaimAt >= cooldownMs;
      const faucetCooldown = canClaimFaucet
        ? null
        : cooldownMs - (now - lastClaimAt);

      res.json({
        balance: balanceAmount,
        canClaimFaucet,
        faucetCooldown,
        lastClaimAt: balance.lastFaucetClaim,
      });
    } catch (error: any) {
      console.error("Faucet status error:", error);
      res.status(500).json({ message: "Failed to get faucet status" });
    }
  });

  app.post("/api/faucet/claim", isPrivyAuthenticated, async (req: PrivyAuthenticatedRequest, res) => {
    try {
      const userId = req.user!.id;
      const balance = await storage.claimFaucet(userId);
      
      // Create agent event for faucet claim
      await storage.createAgentEvent({
        userId,
        type: "faucet_claimed",
        symbol: null,
        message: "claimed 10,000 usdt from faucet",
      });
      
      res.json(balance);
    } catch (error: any) {
      console.error("Faucet claim error:", error);
      res.status(400).json({ message: error.message || "Failed to claim faucet" });
    }
  });

  // ==================== Trade Page Route ====================
  
  app.get("/api/trade/:symbol", isPrivyAuthenticated, async (req: PrivyAuthenticatedRequest, res) => {
    try {
      const userId = req.user!.id;
      const { symbol } = req.params;
      const timeframe = (req.query.timeframe as Timeframe) || "1h";
      
      // Validate timeframe
      const validTimeframes: Timeframe[] = ["1m", "5m", "15m", "1h", "4h", "1d", "1w", "1M"];
      const tf: Timeframe = validTimeframes.includes(timeframe) ? timeframe : "1h";

      // Get token data from storage first
      let token = await storage.getToken(symbol);
      
      // Fetch fresh price data from CoinGecko
      const freshPriceData = await fetchTokenPrice(symbol);
      
      // Update token with fresh price if available
      let currentPrice = 0;
      let priceChange24h = "0";
      
      if (freshPriceData && freshPriceData.price > 0) {
        currentPrice = freshPriceData.price;
        priceChange24h = freshPriceData.change24h.toString();
        // Update stored token with fresh data
        if (token) {
          token = {
            ...token,
            currentPrice: currentPrice.toString(),
            priceChange24h: priceChange24h,
          };
        }
      } else if (token) {
        currentPrice = parseFloat(token.currentPrice || "0");
        priceChange24h = token.priceChange24h || "0";
      }
      
      if (!token && currentPrice <= 0) {
        return res.status(404).json({ message: "Token not found" });
      }

      // Get candles with timeframe
      const candles = await fetchCandles(symbol, tf);

      // Calculate indicators
      const indicators = calculateIndicators(candles);

      // Get user positions for this token
      const allPositions = await storage.getPositions(userId, "open");
      const positions = allPositions.filter((p) => p.tokenId === symbol);

      // Get balance
      const balance = await storage.getBalance(userId);

      // Update unrealized PnL for positions with fresh price
      const positionsWithPnl = positions.map((p) => {
        const entryPrice = parseFloat(p.entryPrice);
        const quantity = parseFloat(p.quantity);
        
        let pnl: number;
        if (p.side === "long") {
          pnl = (currentPrice - entryPrice) * quantity;
        } else {
          pnl = (entryPrice - currentPrice) * quantity;
        }

        return {
          ...p,
          unrealizedPnl: pnl.toFixed(2),
        };
      });

      res.json({
        token: token || {
          id: symbol,
          symbol: symbol,
          name: symbol,
          currentPrice: currentPrice.toString(),
          priceChange24h: priceChange24h,
          volume24h: "0",
        },
        candles,
        indicators,
        positions: positionsWithPnl,
        balance: parseFloat(balance?.amount || "0"),
      });
    } catch (error: any) {
      console.error("Trade page error:", error);
      res.status(500).json({ message: "Failed to load trade data" });
    }
  });

  // ==================== Position Routes ====================
  
  app.post("/api/positions", isPrivyAuthenticated, async (req: PrivyAuthenticatedRequest, res) => {
    try {
      const userId = req.user!.id;
      const { tokenId, side, leverage, margin, takeProfit, stopLoss } = req.body;

      // Validate inputs
      if (!tokenId || !side || !leverage || !margin) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      // Check balance
      const balance = await storage.getBalance(userId);
      const balanceAmount = parseFloat(balance?.amount || "0");
      if (margin > balanceAmount) {
        return res.status(400).json({ message: "Insufficient balance" });
      }

      // Get current price - fetch fresh first
      let currentPrice = 0;
      const freshPrice = await fetchTokenPrice(tokenId);
      if (freshPrice && freshPrice.price > 0) {
        currentPrice = freshPrice.price;
      } else {
        const token = await storage.getToken(tokenId);
        currentPrice = parseFloat(token?.currentPrice || "0");
      }
      if (currentPrice === 0) {
        return res.status(400).json({ message: "Unable to get current price" });
      }

      // Check for existing position on same token and same side (for aggregation)
      const existingPositions = await storage.getPositions(userId, "open");
      const existingPosition = existingPositions.find(
        (p) => p.tokenId === tokenId && p.side === side
      );

      // Calculate new position size
      const newPositionSize = (margin * leverage) / currentPrice;
      const fee = margin * 0.001; // 0.1% fee

      // Deduct margin + fee from balance
      const newBalance = balanceAmount - margin - fee;
      await storage.updateBalance(userId, newBalance.toString());

      let position;

      if (existingPosition) {
        // Aggregate with existing position - calculate weighted average entry price
        const existingMargin = parseFloat(existingPosition.margin);
        const existingQuantity = parseFloat(existingPosition.quantity);
        const existingEntryPrice = parseFloat(existingPosition.entryPrice);

        // Combined values
        const totalMargin = existingMargin + margin;
        const totalQuantity = existingQuantity + newPositionSize;
        
        // Weighted average entry price
        const avgEntryPrice = 
          ((existingEntryPrice * existingQuantity) + (currentPrice * newPositionSize)) / totalQuantity;

        // Recalculate effective leverage and liquidation price
        const positionValue = totalQuantity * avgEntryPrice;
        const effectiveLeverage = positionValue / totalMargin;
        
        let liquidationPrice: number;
        if (side === "long") {
          liquidationPrice = avgEntryPrice * (1 - 0.9 / effectiveLeverage);
        } else {
          liquidationPrice = avgEntryPrice * (1 + 0.9 / effectiveLeverage);
        }

        // Update existing position
        position = await storage.updatePosition(existingPosition.id, {
          entryPrice: avgEntryPrice.toString(),
          quantity: totalQuantity.toString(),
          margin: totalMargin.toString(),
          liquidationPrice: liquidationPrice.toString(),
          // Keep TP/SL from request if provided, otherwise keep existing
          takeProfit: takeProfit?.toString() || existingPosition.takeProfit,
          stopLoss: stopLoss?.toString() || existingPosition.stopLoss,
        });

        // Create trade for the addition
        await storage.createTrade({
          userId,
          positionId: existingPosition.id,
          tokenId,
          side: side === "long" ? "buy" : "sell",
          type: "market",
          price: currentPrice.toString(),
          quantity: newPositionSize.toString(),
          fee: fee.toString(),
        });

        // Create agent event
        await storage.createAgentEvent({
          userId,
          type: "position_added",
          symbol: tokenId,
          message: `added to ${side} position on ${tokenId.toUpperCase()} - new avg entry: $${avgEntryPrice.toFixed(2)}`,
        });
      } else {
        // Create new position
        let liquidationPrice: number;
        if (side === "long") {
          liquidationPrice = currentPrice * (1 - 0.9 / leverage);
        } else {
          liquidationPrice = currentPrice * (1 + 0.9 / leverage);
        }

        position = await storage.createPosition({
          userId,
          tokenId,
          side,
          entryPrice: currentPrice.toString(),
          quantity: newPositionSize.toString(),
          leverage,
          margin: margin.toString(),
          liquidationPrice: liquidationPrice.toString(),
          takeProfit: takeProfit?.toString() || null,
          stopLoss: stopLoss?.toString() || null,
          status: "open",
        });

        // Create opening trade
        await storage.createTrade({
          userId,
          positionId: position.id,
          tokenId,
          side: side === "long" ? "buy" : "sell",
          type: "market",
          price: currentPrice.toString(),
          quantity: newPositionSize.toString(),
          fee: fee.toString(),
        });

        // Create agent event
        await storage.createAgentEvent({
          userId,
          type: "position_opened",
          symbol: tokenId,
          message: `opened ${side} position on ${tokenId.toUpperCase()} with ${leverage}x leverage`,
        });
      }

      res.json(position);
    } catch (error: any) {
      console.error("Create position error:", error);
      res.status(500).json({ message: "Failed to create position" });
    }
  });

  app.post("/api/positions/:id/close", isPrivyAuthenticated, async (req: PrivyAuthenticatedRequest, res) => {
    try {
      const userId = req.user!.id;
      const { id } = req.params;

      // Get position
      const position = await storage.getPosition(id);
      if (!position || position.userId !== userId) {
        return res.status(404).json({ message: "Position not found" });
      }

      if (position.status !== "open") {
        return res.status(400).json({ message: "Position already closed" });
      }

      // Get fresh current price for accurate PnL
      let currentPrice = 0;
      const freshPrice = await fetchTokenPrice(position.tokenId);
      if (freshPrice && freshPrice.price > 0) {
        currentPrice = freshPrice.price;
      } else {
        const storedToken = await storage.getToken(position.tokenId);
        currentPrice = parseFloat(storedToken?.currentPrice || "0");
      }
      const entryPrice = parseFloat(position.entryPrice);
      const quantity = parseFloat(position.quantity);
      const margin = parseFloat(position.margin);

      // Calculate PnL
      let pnl: number;
      if (position.side === "long") {
        pnl = (currentPrice - entryPrice) * quantity;
      } else {
        pnl = (entryPrice - currentPrice) * quantity;
      }

      // Subtract fee
      const fee = margin * 0.001;
      pnl -= fee;

      // Close position
      await storage.closePosition(id, pnl);

      // Return margin + pnl to balance
      const balance = await storage.getBalance(userId);
      const balanceAmount = parseFloat(balance?.amount || "0");
      const newBalance = balanceAmount + margin + pnl;
      await storage.updateBalance(userId, newBalance.toString());

      // Create closing trade
      await storage.createTrade({
        userId,
        positionId: id,
        tokenId: position.tokenId,
        side: position.side === "long" ? "sell" : "buy",
        type: "market",
        price: currentPrice.toString(),
        quantity: quantity.toString(),
        fee: fee.toString(),
        realizedPnl: pnl.toString(),
      });

      // Create agent event
      const pnlFormatted = pnl >= 0 ? `+$${pnl.toFixed(2)}` : `-$${Math.abs(pnl).toFixed(2)}`;
      await storage.createAgentEvent({
        userId,
        type: "position_closed",
        symbol: position.tokenId,
        message: `closed ${position.side} position on ${position.tokenId.toUpperCase()} with ${pnlFormatted} pnl`,
      });

      res.json({ success: true, realizedPnl: pnl });
    } catch (error: any) {
      console.error("Close position error:", error);
      res.status(500).json({ message: "Failed to close position" });
    }
  });

  app.post("/api/positions/close-all", isPrivyAuthenticated, async (req: PrivyAuthenticatedRequest, res) => {
    try {
      const userId = req.user!.id;
      const positions = await storage.getPositions(userId, "open");

      for (const position of positions) {
        // Get fresh current price for accurate PnL
        let currentPrice = 0;
        const freshPrice = await fetchTokenPrice(position.tokenId);
        if (freshPrice && freshPrice.price > 0) {
          currentPrice = freshPrice.price;
        } else {
          const storedToken = await storage.getToken(position.tokenId);
          currentPrice = parseFloat(storedToken?.currentPrice || "0");
        }
        const entryPrice = parseFloat(position.entryPrice);
        const quantity = parseFloat(position.quantity);
        const margin = parseFloat(position.margin);

        // Calculate PnL
        let pnl: number;
        if (position.side === "long") {
          pnl = (currentPrice - entryPrice) * quantity;
        } else {
          pnl = (entryPrice - currentPrice) * quantity;
        }

        const fee = margin * 0.001;
        pnl -= fee;

        // Close position
        await storage.closePosition(position.id, pnl);

        // Return margin + pnl to balance
        const balance = await storage.getBalance(userId);
        const balanceAmount = parseFloat(balance?.amount || "0");
        const newBalance = balanceAmount + margin + pnl;
        await storage.updateBalance(userId, newBalance.toString());

        // Create closing trade
        await storage.createTrade({
          userId,
          positionId: position.id,
          tokenId: position.tokenId,
          side: position.side === "long" ? "sell" : "buy",
          type: "market",
          price: currentPrice.toString(),
          quantity: quantity.toString(),
          fee: fee.toString(),
          realizedPnl: pnl.toString(),
        });

        // Create agent event
        const pnlFormatted = pnl >= 0 ? `+$${pnl.toFixed(2)}` : `-$${Math.abs(pnl).toFixed(2)}`;
        await storage.createAgentEvent({
          userId,
          type: "position_closed",
          symbol: position.tokenId,
          message: `closed ${position.side} position on ${position.tokenId.toUpperCase()} with ${pnlFormatted} pnl`,
        });
      }

      res.json({ success: true, closedCount: positions.length });
    } catch (error: any) {
      console.error("Close all positions error:", error);
      res.status(500).json({ message: "Failed to close positions" });
    }
  });

  // Get all positions with current prices
  app.get("/api/positions", isPrivyAuthenticated, async (req: PrivyAuthenticatedRequest, res) => {
    try {
      const userId = req.user!.id;
      const status = req.query.status as string || "open";
      const positions = await storage.getPositions(userId, status);

      // Fetch fresh prices for all position tokens using batch fetch (faster)
      const tokenIds = Array.from(new Set(positions.map(p => p.tokenId)));
      const batchPrices = await fetchBatchPrices(tokenIds);
      const tokenPrices: Record<string, number> = {};
      
      for (const tokenId of tokenIds) {
        if (batchPrices[tokenId] && batchPrices[tokenId].price > 0) {
          tokenPrices[tokenId] = batchPrices[tokenId].price;
        } else {
          // Fallback to cached price
          const cachedToken = await storage.getToken(tokenId);
          if (cachedToken?.currentPrice) {
            tokenPrices[tokenId] = parseFloat(cachedToken.currentPrice);
          }
        }
      }

      // Add current price and unrealized PnL to each position
      const positionsWithPrices = await Promise.all(positions.map(async (position) => {
        const token = await storage.getToken(position.tokenId);
        const currentPrice = tokenPrices[position.tokenId] || parseFloat(token?.currentPrice || "0");
        const entryPrice = parseFloat(position.entryPrice);
        const quantity = parseFloat(position.quantity);
        const margin = parseFloat(position.margin);
        const leverage = position.leverage;

        // Calculate unrealized PnL
        let unrealizedPnl: number;
        if (position.side === "long") {
          unrealizedPnl = (currentPrice - entryPrice) * quantity;
        } else {
          unrealizedPnl = (entryPrice - currentPrice) * quantity;
        }

        // Calculate ROE (Return on Equity)
        const roe = margin > 0 ? (unrealizedPnl / margin) * 100 : 0;

        // Use stored liquidation price (already calculated during position creation/aggregation/margin updates)
        const storedLiquidationPrice = position.liquidationPrice 
          ? parseFloat(position.liquidationPrice) 
          : entryPrice * (1 - 0.9 / leverage); // fallback for old positions

        return {
          ...position,
          currentPrice: currentPrice.toString(),
          unrealizedPnl: unrealizedPnl.toFixed(2),
          roe: roe.toFixed(2),
          liquidationPrice: storedLiquidationPrice.toString(),
          tokenName: token?.name || position.tokenId,
          tokenSymbol: token?.symbol || position.tokenId,
          tokenImage: token?.image || null,
        };
      }));

      res.json(positionsWithPrices);
    } catch (error: any) {
      console.error("Get positions error:", error);
      res.status(500).json({ message: "Failed to get positions" });
    }
  });

  // Update position settings (TP/SL/limit close)
  app.patch("/api/positions/:id", isPrivyAuthenticated, async (req: PrivyAuthenticatedRequest, res) => {
    try {
      const userId = req.user!.id;
      const { id } = req.params;
      const { takeProfit, stopLoss, limitClosePrice } = req.body;

      // Get position
      const position = await storage.getPosition(id as string);
      if (!position || position.userId !== userId) {
        return res.status(404).json({ message: "Position not found" });
      }

      if (position.status !== "open") {
        return res.status(400).json({ message: "Cannot update closed position" });
      }

      // Update position
      const updates: any = {};
      if (takeProfit !== undefined) updates.takeProfit = takeProfit?.toString() || null;
      if (stopLoss !== undefined) updates.stopLoss = stopLoss?.toString() || null;
      if (limitClosePrice !== undefined) updates.limitClosePrice = limitClosePrice?.toString() || null;

      const updatedPosition = await storage.updatePosition(id as string, updates);

      res.json(updatedPosition);
    } catch (error: any) {
      console.error("Update position error:", error);
      res.status(500).json({ message: "Failed to update position" });
    }
  });

  // Add margin to position
  app.post("/api/positions/:id/add-margin", isPrivyAuthenticated, async (req: PrivyAuthenticatedRequest, res) => {
    try {
      const userId = req.user!.id;
      const { id } = req.params;
      const { amount } = req.body;

      if (!amount || amount <= 0) {
        return res.status(400).json({ message: "Invalid amount" });
      }

      // Get position
      const position = await storage.getPosition(id as string);
      if (!position || position.userId !== userId) {
        return res.status(404).json({ message: "Position not found" });
      }

      if (position.status !== "open") {
        return res.status(400).json({ message: "Cannot add margin to closed position" });
      }

      // Check balance
      const balance = await storage.getBalance(userId);
      const balanceAmount = parseFloat(balance?.amount || "0");
      if (amount > balanceAmount) {
        return res.status(400).json({ message: "Insufficient balance" });
      }

      // Update margin
      const currentMargin = parseFloat(position.margin);
      const newMargin = currentMargin + amount;

      // Recalculate liquidation price with new margin
      const entryPrice = parseFloat(position.entryPrice);
      const leverage = position.leverage;
      const effectiveLeverage = (parseFloat(position.quantity) * entryPrice) / newMargin;
      
      let liquidationPrice: number;
      if (position.side === "long") {
        liquidationPrice = entryPrice * (1 - 0.9 / effectiveLeverage);
      } else {
        liquidationPrice = entryPrice * (1 + 0.9 / effectiveLeverage);
      }

      // Deduct from balance
      await storage.updateBalance(userId, (balanceAmount - amount).toString());

      // Update position
      const updatedPosition = await storage.updatePosition(id as string, {
        margin: newMargin.toString(),
        liquidationPrice: liquidationPrice.toString(),
      });

      // Create event
      await storage.createAgentEvent({
        userId,
        type: "margin_added",
        symbol: position.tokenId,
        message: `added $${amount.toFixed(2)} margin to ${position.side} position on ${position.tokenId.toUpperCase()}`,
      });

      res.json(updatedPosition);
    } catch (error: any) {
      console.error("Add margin error:", error);
      res.status(500).json({ message: "Failed to add margin" });
    }
  });

  // Remove margin from position
  app.post("/api/positions/:id/remove-margin", isPrivyAuthenticated, async (req: PrivyAuthenticatedRequest, res) => {
    try {
      const userId = req.user!.id;
      const { id } = req.params;
      const { amount } = req.body;

      if (!amount || amount <= 0) {
        return res.status(400).json({ message: "Invalid amount" });
      }

      // Get position
      const position = await storage.getPosition(id as string);
      if (!position || position.userId !== userId) {
        return res.status(404).json({ message: "Position not found" });
      }

      if (position.status !== "open") {
        return res.status(400).json({ message: "Cannot remove margin from closed position" });
      }

      // Check if enough margin
      const currentMargin = parseFloat(position.margin);
      const minMargin = (parseFloat(position.quantity) * parseFloat(position.entryPrice)) / 100; // 100x max leverage limit
      if (currentMargin - amount < minMargin) {
        return res.status(400).json({ message: "Cannot remove that much margin, position would be at risk" });
      }

      // Update margin
      const newMargin = currentMargin - amount;

      // Recalculate liquidation price
      const entryPrice = parseFloat(position.entryPrice);
      const effectiveLeverage = (parseFloat(position.quantity) * entryPrice) / newMargin;
      
      let liquidationPrice: number;
      if (position.side === "long") {
        liquidationPrice = entryPrice * (1 - 0.9 / effectiveLeverage);
      } else {
        liquidationPrice = entryPrice * (1 + 0.9 / effectiveLeverage);
      }

      // Add to balance
      const balance = await storage.getBalance(userId);
      const balanceAmount = parseFloat(balance?.amount || "0");
      await storage.updateBalance(userId, (balanceAmount + amount).toString());

      // Update position
      const updatedPosition = await storage.updatePosition(id as string, {
        margin: newMargin.toString(),
        liquidationPrice: liquidationPrice.toString(),
      });

      // Create event
      await storage.createAgentEvent({
        userId,
        type: "margin_removed",
        symbol: position.tokenId,
        message: `removed $${amount.toFixed(2)} margin from ${position.side} position on ${position.tokenId.toUpperCase()}`,
      });

      res.json(updatedPosition);
    } catch (error: any) {
      console.error("Remove margin error:", error);
      res.status(500).json({ message: "Failed to remove margin" });
    }
  });

  // ==================== Trade History Route ====================
  
  app.get("/api/trades", isPrivyAuthenticated, async (req: PrivyAuthenticatedRequest, res) => {
    try {
      const userId = req.user!.id;
      const trades = await storage.getTrades(userId);
      res.json(trades);
    } catch (error: any) {
      console.error("Get trades error:", error);
      res.status(500).json({ message: "Failed to get trades" });
    }
  });

  // ==================== Agent Config Routes ====================
  
  app.get("/api/agent/config", isPrivyAuthenticated, async (req: PrivyAuthenticatedRequest, res) => {
    try {
      const userId = req.user!.id;
      let config = await storage.getAgentConfig(userId);

      if (!config) {
        // Create default config
        config = await storage.upsertAgentConfig({
          userId,
          allowedPairs: ["bitcoin", "ethereum", "solana", "the-open-network", "uniswap", "mantle", "sui", "pyth-network", "jupiter-exchange-solana"],
          maxCapital: "1000",
          maxLeverage: 5,
          maxLossPerDay: "100",
          maxOpenPositions: 3,
          tradeFrequencyMinutes: 30,
          strategy: "trend",
          useEmaFilter: true,
          useRsiFilter: true,
          useVolatilityFilter: false,
          status: "paused",
        });
      }

      res.json(config);
    } catch (error: any) {
      console.error("Get agent config error:", error);
      res.status(500).json({ message: "Failed to get agent config" });
    }
  });

  app.patch("/api/agent/config", isPrivyAuthenticated, async (req: PrivyAuthenticatedRequest, res) => {
    try {
      const userId = req.user!.id;
      const updates = req.body;

      const config = await storage.upsertAgentConfig({
        userId,
        ...updates,
      });

      res.json(config);
    } catch (error: any) {
      console.error("Update agent config error:", error);
      res.status(500).json({ message: "Failed to update agent config" });
    }
  });

  app.post("/api/agent/start", isPrivyAuthenticated, async (req: PrivyAuthenticatedRequest, res) => {
    try {
      const userId = req.user!.id;
      const config = await storage.upsertAgentConfig({
        userId,
        status: "running",
      });
      
      // Create agent event
      await storage.createAgentEvent({
        userId,
        type: "agent_started",
        symbol: null,
        message: "automation agent started",
      });
      
      res.json(config);
    } catch (error: any) {
      console.error("Start agent error:", error);
      res.status(500).json({ message: "Failed to start agent" });
    }
  });

  app.post("/api/agent/pause", isPrivyAuthenticated, async (req: PrivyAuthenticatedRequest, res) => {
    try {
      const userId = req.user!.id;
      const config = await storage.upsertAgentConfig({
        userId,
        status: "paused",
      });
      
      // Create agent event
      await storage.createAgentEvent({
        userId,
        type: "agent_paused",
        symbol: null,
        message: "automation agent paused",
      });
      
      res.json(config);
    } catch (error: any) {
      console.error("Pause agent error:", error);
      res.status(500).json({ message: "Failed to pause agent" });
    }
  });

  // ==================== Agent Events Route ====================
  
  app.get("/api/agent/events", isPrivyAuthenticated, async (req: PrivyAuthenticatedRequest, res) => {
    try {
      const userId = req.user!.id;
      const limit = parseInt(req.query.limit as string) || 20;
      const events = await storage.getAgentEvents(userId, limit);
      // Filter to only agent-related events (exclude faucet_claimed, position_opened/closed without agentId)
      const agentOnlyEvents = events.filter(e => 
        e.agentId === "automation" || 
        e.type === "scanning" ||
        e.type === "tp_hit" ||
        e.type === "sl_hit" ||
        e.type === "liquidated"
      );
      res.json(agentOnlyEvents);
    } catch (error: any) {
      console.error("Get agent events error:", error);
      res.status(500).json({ message: "Failed to get agent events" });
    }
  });

  // Get agent positions only (not user manual positions)
  app.get("/api/agent/positions", isPrivyAuthenticated, async (req: PrivyAuthenticatedRequest, res) => {
    try {
      const userId = req.user!.id;
      const status = req.query.status as string || "open";
      const positions = await storage.getPositions(userId, status, true); // true = agent trades only

      const positionsWithPrices = await Promise.all(positions.map(async (position) => {
        // Get stored token data for metadata
        const storedToken = await storage.getToken(position.tokenId);
        
        // Fetch fresh price for accurate PnL
        let currentPrice = 0;
        const freshPriceData = await fetchTokenPrice(position.tokenId);
        if (freshPriceData && freshPriceData.price > 0) {
          currentPrice = freshPriceData.price;
        } else if (storedToken) {
          currentPrice = parseFloat(storedToken.currentPrice || "0");
        }
        
        const entryPrice = parseFloat(position.entryPrice);
        const quantity = parseFloat(position.quantity);
        const margin = parseFloat(position.margin);

        let unrealizedPnl = 0;
        if (currentPrice > 0 && entryPrice > 0) {
          if (position.side === "long") {
            unrealizedPnl = (currentPrice - entryPrice) * quantity;
          } else {
            unrealizedPnl = (entryPrice - currentPrice) * quantity;
          }
        }

        const roe = margin > 0 ? (unrealizedPnl / margin) * 100 : 0;
        const storedLiquidationPrice = position.liquidationPrice 
          ? parseFloat(position.liquidationPrice) 
          : entryPrice * (1 - 0.9 / position.leverage);

        return {
          ...position,
          currentPrice: currentPrice.toString(),
          unrealizedPnl: unrealizedPnl.toFixed(2),
          roe: roe.toFixed(2),
          liquidationPrice: storedLiquidationPrice.toString(),
          tokenName: storedToken?.name || position.tokenId,
          tokenSymbol: storedToken?.symbol || position.tokenId,
          tokenImage: storedToken?.image || null,
        };
      }));

      res.json(positionsWithPrices);
    } catch (error: any) {
      console.error("Get agent positions error:", error);
      res.status(500).json({ message: "Failed to get agent positions" });
    }
  });

  // Get agent statistics
  app.get("/api/agent/stats", isPrivyAuthenticated, async (req: PrivyAuthenticatedRequest, res) => {
    try {
      const userId = req.user!.id;
      const stats = await storage.getAgentStats(userId);
      
      const accuracy = stats.totalTrades > 0 
        ? ((stats.winTrades / stats.totalTrades) * 100).toFixed(1)
        : "0.0";
      
      res.json({
        totalTrades: stats.totalTrades,
        winTrades: stats.winTrades,
        lossTrades: stats.totalTrades - stats.winTrades,
        totalProfit: stats.totalProfit.toFixed(2),
        accuracy,
        openPositions: stats.openPositions,
      });
    } catch (error: any) {
      console.error("Get agent stats error:", error);
      res.status(500).json({ message: "Failed to get agent stats" });
    }
  });

  // Close all agent positions only (not user positions)
  app.post("/api/agent/close-all", isPrivyAuthenticated, async (req: PrivyAuthenticatedRequest, res) => {
    try {
      const userId = req.user!.id;
      const positions = await storage.getPositions(userId, "open", true); // true = agent trades only

      for (const position of positions) {
        // Get fresh current price for accurate PnL
        let currentPrice = 0;
        const freshPrice = await fetchTokenPrice(position.tokenId);
        if (freshPrice && freshPrice.price > 0) {
          currentPrice = freshPrice.price;
        } else {
          const storedToken = await storage.getToken(position.tokenId);
          currentPrice = parseFloat(storedToken?.currentPrice || "0");
        }
        const entryPrice = parseFloat(position.entryPrice);
        const quantity = parseFloat(position.quantity);
        const margin = parseFloat(position.margin);

        let pnl: number;
        if (position.side === "long") {
          pnl = (currentPrice - entryPrice) * quantity;
        } else {
          pnl = (entryPrice - currentPrice) * quantity;
        }

        const fee = margin * 0.001;
        pnl -= fee;

        await storage.closePosition(position.id, pnl);

        const balance = await storage.getBalance(userId);
        const balanceAmount = parseFloat(balance?.amount || "0");
        const newBalance = balanceAmount + margin + pnl;
        await storage.updateBalance(userId, newBalance.toString());

        await storage.createTrade({
          userId,
          positionId: position.id,
          tokenId: position.tokenId,
          side: position.side === "long" ? "sell" : "buy",
          type: "market",
          price: currentPrice.toString(),
          quantity: quantity.toString(),
          fee: fee.toString(),
          realizedPnl: pnl.toString(),
          isAgentTrade: true,
        });

        const pnlFormatted = pnl >= 0 ? `+$${pnl.toFixed(2)}` : `-$${Math.abs(pnl).toFixed(2)}`;
        await storage.createAgentEvent({
          userId,
          agentId: "automation",
          type: "position_closed",
          symbol: position.tokenId,
          message: `manually closed ${position.side} position on ${position.tokenId.toUpperCase()} with ${pnlFormatted} pnl`,
        });
      }

      res.json({ success: true, closedCount: positions.length });
    } catch (error: any) {
      console.error("Close all agent positions error:", error);
      res.status(500).json({ message: "Failed to close agent positions" });
    }
  });

  // ==================== User Info Route ====================
  
  app.get("/api/auth/user", isPrivyAuthenticated, async (req: PrivyAuthenticatedRequest, res) => {
    try {
      const user = await storage.getUser(req.user!.id);
      res.json({
        id: req.user!.id,
        email: user?.email || req.user!.email,
        username: user?.username,
        firstName: user?.firstName,
        lastName: user?.lastName,
        profileImageData: user?.profileImageData,
        privyUserId: req.user!.privyUserId,
        createdAt: user?.createdAt,
      });
    } catch (error: any) {
      console.error("Get user error:", error);
      res.status(500).json({ message: "Failed to get user" });
    }
  });

  // Update user profile
  app.patch("/api/profile", isPrivyAuthenticated, async (req: PrivyAuthenticatedRequest, res) => {
    try {
      const userId = req.user!.id;
      const { username, firstName, lastName, profileImageData } = req.body;

      // Validate username length
      if (username && username.length > 50) {
        return res.status(400).json({ message: "username too long (max 50 characters)" });
      }

      // Validate image size (max 100KB base64)
      if (profileImageData && profileImageData.length > 150000) {
        return res.status(400).json({ message: "image too large (max 100kb)" });
      }

      const updates: Record<string, any> = {};
      if (username !== undefined) updates.username = username;
      if (firstName !== undefined) updates.firstName = firstName;
      if (lastName !== undefined) updates.lastName = lastName;
      if (profileImageData !== undefined) updates.profileImageData = profileImageData;

      const updatedUser = await storage.updateUser(userId, updates);
      
      if (!updatedUser) {
        return res.status(404).json({ message: "user not found" });
      }

      res.json({
        id: updatedUser.id,
        email: updatedUser.email,
        username: updatedUser.username,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        profileImageData: updatedUser.profileImageData,
        createdAt: updatedUser.createdAt,
      });
    } catch (error: any) {
      console.error("Update profile error:", error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  return httpServer;
}
