import { storage } from "../storage";
import { fetchTokenPrice, fetchBatchPrices } from "./priceService";

const INTERVAL_MS = 30000; // Run every 30 seconds for signal scanning
const TP_SL_CHECK_INTERVAL_MS = 5000; // Check TP/SL every 5 seconds
const MIN_TRADE_INTERVAL_MS = 120000; // Minimum 2 minutes between trades per agent
const FIRST_TRADE_GUARANTEE_MS = 240000; // Guarantee first trade within 4 minutes

// Cache for price momentum analysis
const priceHistory: Map<string, { prices: number[], lastUpdate: number }> = new Map();

class AgentRunner {
  private isRunning = false;
  private intervalId: NodeJS.Timeout | null = null;
  private tpSlIntervalId: NodeJS.Timeout | null = null;
  private agentAttempts: Map<string, number> = new Map(); // Track attempts since last trade

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    console.log("[agent] starting automation runner (30s signal scan, 5s TP/SL checks, 2min trade cycles)...");
    
    this.intervalId = setInterval(() => this.tick(), INTERVAL_MS);
    this.tpSlIntervalId = setInterval(() => this.checkTpSlOrders(), TP_SL_CHECK_INTERVAL_MS);
    
    // Run immediately on start
    this.tick();
    this.checkTpSlOrders();
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    if (this.tpSlIntervalId) {
      clearInterval(this.tpSlIntervalId);
      this.tpSlIntervalId = null;
    }
    this.isRunning = false;
    console.log("[agent] stopped automation runner");
  }

  private async tick() {
    if (!this.isRunning) return;
    
    try {
      const runningConfigs = await storage.getRunningAgentConfigs();
      
      // Process agents in parallel for better performance under load
      await Promise.allSettled(
        runningConfigs.map(config => this.processAgent(config).catch(err => {
          console.error(`[agent] error processing agent for user ${config.userId}:`, err);
        }))
      );
    } catch (error) {
      console.error("[agent] tick error:", error);
      // Continue running - don't let errors stop the automation
    }
  }

  private async checkTpSlOrders() {
    if (!this.isRunning) return;
    
    try {
      const runningConfigs = await storage.getRunningAgentConfigs();
      
      // Process TP/SL checks in parallel for better performance
      await Promise.allSettled(
        runningConfigs.map(config => this.checkAgentPositions(config.userId).catch(err => {
          console.error(`[agent] error checking TP/SL for user ${config.userId}:`, err);
        }))
      );
    } catch (error) {
      console.error("[agent] TP/SL check error:", error);
      // Continue running - don't let errors stop the automation
    }
  }

  private async checkAgentPositions(userId: string) {
    // Get all open agent positions
    const openPositions = await storage.getPositions(userId, "open", true);
    
    for (const position of openPositions) {
      // Fetch fresh price for accurate TP/SL checks
      let currentPrice = 0;
      try {
        const priceData = await fetchTokenPrice(position.tokenId);
        if (priceData && priceData.price > 0) {
          currentPrice = priceData.price;
        }
      } catch (e) {
        // Fall back to stored price
      }
      
      // Fallback to stored token price
      if (currentPrice <= 0) {
        const token = await storage.getToken(position.tokenId);
        if (token) {
          currentPrice = parseFloat(token.currentPrice || "0");
        }
      }
      
      if (currentPrice <= 0) continue;
      
      const entryPrice = parseFloat(position.entryPrice);
      const quantity = parseFloat(position.quantity);
      const margin = parseFloat(position.margin);
      const liquidationPrice = parseFloat(position.liquidationPrice || "0");
      const takeProfit = position.takeProfit ? parseFloat(position.takeProfit) : null;
      const stopLoss = position.stopLoss ? parseFloat(position.stopLoss) : null;
      
      let shouldClose = false;
      let closeReason = "";
      
      // Check liquidation
      if (position.side === "long" && currentPrice <= liquidationPrice) {
        shouldClose = true;
        closeReason = "liquidated";
      } else if (position.side === "short" && currentPrice >= liquidationPrice) {
        shouldClose = true;
        closeReason = "liquidated";
      }
      
      // Check take profit
      if (takeProfit && !shouldClose) {
        if (position.side === "long" && currentPrice >= takeProfit) {
          shouldClose = true;
          closeReason = "tp_hit";
        } else if (position.side === "short" && currentPrice <= takeProfit) {
          shouldClose = true;
          closeReason = "tp_hit";
        }
      }
      
      // Check stop loss
      if (stopLoss && !shouldClose) {
        if (position.side === "long" && currentPrice <= stopLoss) {
          shouldClose = true;
          closeReason = "sl_hit";
        } else if (position.side === "short" && currentPrice >= stopLoss) {
          shouldClose = true;
          closeReason = "sl_hit";
        }
      }
      
      if (shouldClose) {
        // Calculate PnL
        let pnl: number;
        if (closeReason === "liquidated") {
          pnl = -margin; // Full margin loss on liquidation
        } else {
          if (position.side === "long") {
            pnl = (currentPrice - entryPrice) * quantity;
          } else {
            pnl = (entryPrice - currentPrice) * quantity;
          }
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
          isAgentTrade: true,
        });
        
        // Create agent event
        const pnlFormatted = pnl >= 0 ? `+$${pnl.toFixed(2)}` : `-$${Math.abs(pnl).toFixed(2)}`;
        let message = "";
        if (closeReason === "tp_hit") {
          message = `take profit hit on ${position.tokenId.toUpperCase()} ${position.side} - closed with ${pnlFormatted}`;
        } else if (closeReason === "sl_hit") {
          message = `stop loss hit on ${position.tokenId.toUpperCase()} ${position.side} - closed with ${pnlFormatted}`;
        } else {
          message = `${position.tokenId.toUpperCase()} ${position.side} position liquidated - ${pnlFormatted}`;
        }
        
        await storage.createAgentEvent({
          userId,
          agentId: "automation",
          type: closeReason === "liquidated" ? "liquidated" : closeReason,
          symbol: position.tokenId,
          message,
        });
        
        console.log(`[agent] closed ${position.side} position for ${position.tokenId}: ${closeReason} @ ${currentPrice}`);
      }
    }
  }

  private async processAgent(config: any) {
    const userId = config.userId;
    
    const lastRun = config.lastRunAt ? new Date(config.lastRunAt).getTime() : 0;
    const now = Date.now();
    
    // Use 2 minute minimum interval for trades
    const minInterval = MIN_TRADE_INTERVAL_MS;
    
    // Track attempts since last trade
    const attempts = this.agentAttempts.get(userId) || 0;
    
    // Calculate time since last trade
    const timeSinceLastTrade = now - lastRun;
    
    // Force a trade if:
    // - It's been 4+ minutes with no trade at all (first trade guarantee)
    // - OR it's been 2+ minutes and 4+ attempts since last trade
    const isFirstTradeNeeded = lastRun === 0 || timeSinceLastTrade >= FIRST_TRADE_GUARANTEE_MS;
    const shouldForceSignal = isFirstTradeNeeded || (timeSinceLastTrade >= minInterval && attempts >= 4);
    
    // Minimum interval check - always scan but only trade every 2 mins
    if (timeSinceLastTrade < minInterval) {
      // Still within cooldown, just log scanning
      if (attempts === 0 || attempts % 2 === 0) {
        await storage.createAgentEvent({
          userId,
          agentId: "automation",
          type: "scanning",
          message: `scanning markets... analyzing signals`,
        });
      }
      this.agentAttempts.set(userId, attempts + 1);
      return;
    }

    const balance = await storage.getBalance(userId);
    if (!balance || parseFloat(balance.amount) <= 0) {
      return;
    }

    // Only count AGENT open positions for limit
    const openPositions = await storage.getPositions(userId, "open", true);
    if (openPositions.length >= (config.maxOpenPositions || 3)) {
      await storage.updateAgentLastRun(userId);
      this.agentAttempts.set(userId, 0);
      return;
    }

    const allowedPairs = (config.allowedPairs as string[]) || [];
    if (allowedPairs.length === 0) {
      return;
    }

    // Fetch prices for all allowed pairs first
    const batchPrices = await fetchBatchPrices(allowedPairs);
    
    // Find pair with valid price
    let selectedPair: string | null = null;
    let currentPrice = 0;
    
    // Shuffle allowed pairs for randomness
    const shuffledPairs = [...allowedPairs].sort(() => Math.random() - 0.5);
    
    for (const pair of shuffledPairs) {
      if (batchPrices[pair] && batchPrices[pair].price > 0) {
        selectedPair = pair;
        currentPrice = batchPrices[pair].price;
        break;
      }
    }
    
    // Fallback to individual fetch if batch failed
    if (!selectedPair) {
      for (const pair of shuffledPairs) {
        try {
          const priceData = await fetchTokenPrice(pair);
          if (priceData && priceData.price > 0) {
            selectedPair = pair;
            currentPrice = priceData.price;
            break;
          }
        } catch (e) {
          // Continue to next pair
        }
      }
    }
    
    // Final fallback to database prices if API fetches failed
    if (!selectedPair) {
      for (const pair of shuffledPairs) {
        try {
          const token = await storage.getToken(pair);
          if (token && parseFloat(token.currentPrice) > 0) {
            selectedPair = pair;
            currentPrice = parseFloat(token.currentPrice);
            console.log(`[agent] using cached DB price for ${pair}: $${currentPrice}`);
            break;
          }
        } catch (e) {
          // Continue to next pair
        }
      }
    }

    if (!selectedPair || currentPrice <= 0) {
      console.log(`[agent] no valid prices available for any allowed pair`);
      return;
    }
    
    const randomPair = selectedPair;
    
    // Generate signal with improved trading logic
    const signal = await this.generateSignal(config, randomPair, currentPrice, shouldForceSignal);
    if (!signal) {
      // Create scanning event
      await storage.createAgentEvent({
        userId,
        agentId: "automation",
        type: "scanning",
        message: `scanning markets... evaluating ${randomPair.toUpperCase()} entry points`,
      });
      this.agentAttempts.set(userId, attempts + 1);
      return;
    }

    const maxCapital = parseFloat(config.maxCapital || "1000");
    const availableBalance = parseFloat(balance.amount);
    const maxMarginPerTrade = parseFloat(config.maxMarginPerTrade || "300");
    
    // Use user-configured margin amount exactly as specified
    // Only cap if margin exceeds available balance (hard constraint)
    let margin: number = maxMarginPerTrade;
    
    // Only cap margin if it exceeds available balance - this is a hard constraint
    // Don't use percentage caps - honor the user's configured amount
    if (margin > availableBalance) {
      margin = availableBalance * 0.9; // Use 90% of available balance at most
    }
    
    // Minimum margin check
    if (margin < 10) {
      return;
    }

    const leverage = Math.min(config.maxLeverage || 5, 25);
    const quantity = (margin * leverage) / currentPrice;
    const fee = margin * 0.001;
    const liquidationPrice = signal.side === "long"
      ? currentPrice * (1 - 0.9 / leverage)
      : currentPrice * (1 + 0.9 / leverage);
    
    // Auto TP/SL based on strategy
    const tpPercent = signal.side === "long" ? 1.05 : 0.95; // 5% TP
    const slPercent = signal.side === "long" ? 0.97 : 1.03; // 3% SL
    const takeProfit = currentPrice * tpPercent;
    const stopLoss = currentPrice * slPercent;

    const position = await storage.createPosition({
      userId,
      tokenId: randomPair,
      side: signal.side,
      entryPrice: currentPrice.toString(),
      quantity: quantity.toString(),
      leverage,
      margin: margin.toString(),
      liquidationPrice: liquidationPrice.toString(),
      takeProfit: takeProfit.toString(),
      stopLoss: stopLoss.toString(),
      isAgentTrade: true,
      status: "open",
    });

    await storage.createTrade({
      userId,
      positionId: position.id,
      tokenId: randomPair,
      side: signal.side === "long" ? "buy" : "sell",
      type: "market",
      price: currentPrice.toString(),
      quantity: quantity.toString(),
      fee: fee.toString(),
      isAgentTrade: true,
    });

    const newBalance = availableBalance - margin - fee;
    await storage.updateBalance(userId, newBalance.toString());
    await storage.updateAgentLastRun(userId);
    
    // Reset attempts after successful trade
    this.agentAttempts.set(userId, 0);

    // Create agent event
    await storage.createAgentEvent({
      userId,
      agentId: "automation",
      type: "position_opened",
      symbol: randomPair,
      message: `opened ${signal.side} ${randomPair.toUpperCase()} @ $${currentPrice.toFixed(2)} | margin: $${margin.toFixed(2)} | ${leverage}x leverage | tp: $${takeProfit.toFixed(2)} | sl: $${stopLoss.toFixed(2)}`,
    });

    console.log(`[agent] opened ${signal.side} position for user ${userId}: ${randomPair} @ ${currentPrice}`);
  }

  private async generateSignal(
    config: any, 
    tokenId: string,
    currentPrice: number,
    forceSignal: boolean = false
  ): Promise<{ side: "long" | "short", confidence: number } | null> {
    // Get price history for momentum analysis
    const history = priceHistory.get(tokenId);
    const now = Date.now();
    
    // Update price history
    if (!history || now - history.lastUpdate > 60000) {
      // Start fresh history
      priceHistory.set(tokenId, { prices: [currentPrice], lastUpdate: now });
    } else {
      // Add to history, keep last 10 prices
      const prices = [...history.prices, currentPrice].slice(-10);
      priceHistory.set(tokenId, { prices, lastUpdate: now });
    }
    
    const priceData = priceHistory.get(tokenId)!;
    const prices = priceData.prices;
    
    // Require minimum 5 price points for quality momentum signals
    // Unless forceSignal is true, we need sufficient history
    const MIN_HISTORY_LENGTH = 5;
    const hasEnoughHistory = prices.length >= MIN_HISTORY_LENGTH;
    
    if (!hasEnoughHistory && !forceSignal) {
      // Not enough history and not forced - skip signal generation
      return null;
    }
    
    // Calculate momentum indicators
    let momentum = 0;
    let volatility = 0;
    let trend = 0;
    
    if (prices.length >= 3) {
      // Simple momentum: compare current vs avg
      const avg = prices.reduce((a, b) => a + b, 0) / prices.length;
      momentum = (currentPrice - avg) / avg;
      
      // Volatility: standard deviation
      const variance = prices.reduce((sum, p) => sum + Math.pow(p - avg, 2), 0) / prices.length;
      volatility = Math.sqrt(variance) / avg;
      
      // Trend: last 3 prices direction
      const recent = prices.slice(-3);
      if (recent[2] > recent[1] && recent[1] > recent[0]) {
        trend = 1; // Uptrend
      } else if (recent[2] < recent[1] && recent[1] < recent[0]) {
        trend = -1; // Downtrend
      }
    }
    
    // Strategy-based signal generation
    const strategy = config.strategy || "trend";
    const useEmaFilter = config.useEmaFilter !== false;
    const useRsiFilter = config.useRsiFilter !== false;
    const useVolatilityFilter = config.useVolatilityFilter === true;
    
    // Skip low volatility periods if filter enabled
    if (useVolatilityFilter && volatility < 0.001) {
      if (!forceSignal) return null;
    }
    
    let signalStrength = 0;
    let side: "long" | "short" = "long";
    
    if (strategy === "trend") {
      // Follow the trend - go with momentum
      if (trend === 1 && momentum > 0) {
        signalStrength = 0.7 + momentum * 10;
        side = "long";
      } else if (trend === -1 && momentum < 0) {
        signalStrength = 0.7 + Math.abs(momentum) * 10;
        side = "short";
      } else if (momentum > 0.002) {
        signalStrength = 0.5 + momentum * 5;
        side = "long";
      } else if (momentum < -0.002) {
        signalStrength = 0.5 + Math.abs(momentum) * 5;
        side = "short";
      }
    } else if (strategy === "mean_reversion") {
      // Bet on price returning to mean
      if (momentum > 0.01) {
        signalStrength = 0.6 + momentum * 5;
        side = "short"; // Price too high, bet on drop
      } else if (momentum < -0.01) {
        signalStrength = 0.6 + Math.abs(momentum) * 5;
        side = "long"; // Price too low, bet on rise
      }
    } else if (strategy === "breakout") {
      // High volatility with clear direction
      if (volatility > 0.005) {
        if (trend === 1) {
          signalStrength = 0.8;
          side = "long";
        } else if (trend === -1) {
          signalStrength = 0.8;
          side = "short";
        }
      }
    }
    
    // Apply filters to adjust signal strength
    if (useEmaFilter && prices.length >= 5) {
      // Simple EMA check - price above/below average
      const avg = prices.reduce((a, b) => a + b, 0) / prices.length;
      if (side === "long" && currentPrice < avg) {
        signalStrength *= 0.7; // Reduce confidence
      } else if (side === "short" && currentPrice > avg) {
        signalStrength *= 0.7;
      }
    }
    
    if (useRsiFilter) {
      // Avoid overbought/oversold - simple version
      if (momentum > 0.03) {
        // Potentially overbought - don't go long
        if (side === "long") signalStrength *= 0.5;
      } else if (momentum < -0.03) {
        // Potentially oversold - don't go short  
        if (side === "short") signalStrength *= 0.5;
      }
    }
    
    // Force signal after extended scanning
    if (forceSignal && signalStrength < 0.3) {
      signalStrength = 0.5;
      // Pick direction based on slight momentum or random
      side = momentum >= 0 ? "long" : "short";
    }
    
    // Random component for variety (adds 10-30% chance)
    const randomBoost = Math.random() * 0.3 + 0.1;
    signalStrength += randomBoost;
    
    // Minimum threshold to generate signal
    if (signalStrength < 0.5 && !forceSignal) {
      return null;
    }
    
    // Cap confidence at 95%
    const confidence = Math.min(signalStrength, 0.95);
    
    return { side, confidence };
  }
}

export const agentRunner = new AgentRunner();
