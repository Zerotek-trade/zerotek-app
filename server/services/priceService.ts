import { storage } from "../storage";
import type { InsertToken } from "@shared/schema";

// In-memory cache
interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const cache = new Map<string, CacheEntry<any>>();

// Helper functions to get and set cached data
function getCachedData<T>(key: string): T | null {
  const entry = cache.get(key);
  if (entry && Date.now() - entry.timestamp < (entry as any).ttl) {
    return entry.data as T;
  }
  return null;
}

function setCachedData<T>(key: string, data: T, ttl: number): void {
  cache.set(key, { data, timestamp: Date.now(), ttl } as any);
}

const TICKER_CACHE_TTL = 5 * 1000; // 5 seconds for real-time price updates
const TOKEN_LIST_CACHE_TTL = 60 * 1000; // 60 seconds for token list (less frequent)
const CANDLE_CACHE_TTL = 30 * 1000; // 30 seconds for candles

// CoinGecko ID to Binance symbol mapping (for primary price fetching)
const BINANCE_SYMBOL_MAP: Record<string, string> = {
  bitcoin: "BTCUSDT",
  ethereum: "ETHUSDT",
  solana: "SOLUSDT",
  "binancecoin": "BNBUSDT",
  cardano: "ADAUSDT",
  ripple: "XRPUSDT",
  dogecoin: "DOGEUSDT",
  polkadot: "DOTUSDT",
  avalanche: "AVAXUSDT",
  "shiba-inu": "SHIBUSDT",
  matic: "MATICUSDT",
  litecoin: "LTCUSDT",
  chainlink: "LINKUSDT",
  uniswap: "UNIUSDT",
  stellar: "XLMUSDT",
  cosmos: "ATOMUSDT",
  monero: "XMRUSDT",
  "ethereum-classic": "ETCUSDT",
  "internet-computer": "ICPUSDT",
  filecoin: "FILUSDT",
  hedera: "HBARUSDT",
  "the-sandbox": "SANDUSDT",
  "axie-infinity": "AXSUSDT",
  "decentraland": "MANAUSDT",
  tezos: "XTZUSDT",
  aave: "AAVEUSDT",
  "the-graph": "GRTUSDT",
  eos: "EOSUSDT",
  flow: "FLOWUSDT",
  maker: "MKRUSDT",
  "basic-attention-token": "BATUSDT",
  compound: "COMPUSDT",
  curve: "CRVUSDT",
  "sushi": "SUSHIUSDT",
  "1inch": "1INCHUSDT",
  yearn: "YFIUSDT",
  enjin: "ENJUSDT",
  zilliqa: "ZILUSDT",
  loopring: "LRCUSDT",
  ankr: "ANKRUSDT",
  render: "RENDERUSDT",
  pepe: "PEPEUSDT",
  bonk: "BONKUSDT",
  jupiter: "JUPUSDT",
  raydium: "RAYUSDT",
  sui: "SUIUSDT",
  tron: "TRXUSDT",
  aptos: "APTUSDT",
  near: "NEARUSDT",
  optimism: "OPUSDT",
  arbitrum: "ARBUSDT",
  injective: "INJUSDT",
  sei: "SEIUSDT",
  celestia: "TIAUSDT",
  starknet: "STRKUSDT",
  toncoin: "TONUSDT",
  immutable: "IMXUSDT",
  vechain: "VETUSDT",
  fantom: "FTMUSDT",
  theta: "THETAUSDT",
  algorand: "ALGOUSDT",
  gala: "GALAUSDT",
};

// Pinned pairs that should always be at the top
const PINNED_SYMBOLS = ["sol", "jup", "bonk", "btc", "eth", "ray"];

// Stablecoins to exclude from trading pairs (only volatile assets allowed)
const STABLECOIN_IDS = [
  "tether",
  "usd-coin", 
  "binance-usd",
  "dai",
  "trueusd",
  "paxos-standard",
  "gemini-dollar",
  "frax",
  "usdd",
  "first-digital-usd",
  "paypal-usd",
  "binance-peg-bsc-usd",
  "stasis-eurs",
  "euro-coin",
  "tether-eurt",
  "bridged-usdc-polygon-pos-bridge",
  "multi-collateral-dai",
  "celo-dollar",
  "fei-usd",
  "neutrino",
  "terrausd",
  "magic-internet-money",
  "liquity-usd",
  "alchemix-usd",
  "nusd",
  "origin-dollar",
  "husd",
  "susd",
  "tribe-2",
  "flexusd",
  "vai",
  "mim",
  "usdx",
  "usdp",
  "staked-ether",
  "wrapped-bitcoin",
  "usds",
  "ethena-usde",
  "ethena-staked-usde",
  "usdb",
  "usual-usd",
  "ondo-us-dollar-yield",
  "mountain-protocol-usdm",
  "savings-dai",
  "tether-gold",
  "pax-gold",
  "binance-bridged-usdc-bnb-smart-chain",
  "binance-bridged-usdt-bnb-smart-chain",
];

function getCached<T>(key: string, ttl: number): T | null {
  const entry = cache.get(key);
  if (entry && Date.now() - entry.timestamp < ttl) {
    return entry.data;
  }
  return null;
}

function setCache<T>(key: string, data: T): void {
  cache.set(key, { data, timestamp: Date.now() });
}

// Exponential backoff for rate limiting
async function fetchWithRetry(url: string, retries = 3): Promise<Response> {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url);
      if (response.status === 429) {
        const delay = Math.pow(2, i) * 1000;
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }
      return response;
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }
  throw new Error("Max retries exceeded");
}

// CoinGecko ID to Binance US symbol mapping - comprehensive list
const BINANCE_US_SYMBOL_MAP: Record<string, string> = {
  // Major coins
  bitcoin: "BTCUSDT",
  ethereum: "ETHUSDT",
  solana: "SOLUSDT",
  binancecoin: "BNBUSDT",
  ripple: "XRPUSDT",
  cardano: "ADAUSDT",
  dogecoin: "DOGEUSDT",
  tron: "TRXUSDT",
  polkadot: "DOTUSDT",
  avalanche: "AVAXUSDT",
  "shiba-inu": "SHIBUSDT",
  litecoin: "LTCUSDT",
  chainlink: "LINKUSDT",
  uniswap: "UNIUSDT",
  stellar: "XLMUSDT",
  cosmos: "ATOMUSDT",
  // Additional popular tokens
  "wrapped-bitcoin": "WBTCUSDT",
  "bitcoin-cash": "BCHUSDT",
  matic: "MATICUSDT",
  "polygon-ecosystem-token": "POLUSDT",
  near: "NEARUSDT",
  aave: "AAVEUSDT",
  "the-graph": "GRTUSDT",
  filecoin: "FILUSDT",
  vechain: "VETUSDT",
  algorand: "ALGOUSDT",
  hedera: "HBARUSDT",
  aptos: "APTUSDT",
  arbitrum: "ARBUSDT",
  optimism: "OPUSDT",
  immutable: "IMXUSDT",
  injective: "INJUSDT",
  sei: "SEIUSDT",
  render: "RNDRUSDT",
  sui: "SUIUSDT",
  maker: "MKRUSDT",
  fantom: "FTMUSDT",
  flow: "FLOWUSDT",
  eos: "EOSUSDT",
  neo: "NEOUSDT",
  iota: "IOTAUSDT",
  kava: "KAVAUSDT",
  celo: "CELOUSDT",
  sand: "SANDUSDT",
  decentraland: "MANAUSDT",
  axie: "AXSUSDT",
  ens: "ENSUSDT",
  lido: "LDOUSDT",
  compound: "COMPUSDT",
  curve: "CRVUSDT",
  synthetix: "SNXUSDT",
  "1inch": "1INCHUSDT",
  sushi: "SUSHIUSDT",
  yearn: "YFIUSDT",
  pancakeswap: "CAKEUSDT",
};

// Batch fetch prices - uses Binance US (works from this server) then CoinGecko as fallback
export async function fetchBatchPrices(tokenIds: string[]): Promise<Record<string, { price: number; change24h: number }>> {
  const results: Record<string, { price: number; change24h: number }> = {};
  
  if (tokenIds.length === 0) return results;
  
  // Check in-memory cache first (short 10s TTL for real-time prices)
  const cacheKey = "batch_prices_live";
  const cachedPrices = getCachedData<Record<string, { price: number; change24h: number }>>(cacheKey);
  
  if (cachedPrices) {
    for (const tokenId of tokenIds) {
      if (cachedPrices[tokenId]) {
        results[tokenId] = cachedPrices[tokenId];
      }
    }
    // If all tokens found in fresh cache, return immediately
    if (tokenIds.every(id => results[id])) {
      return results;
    }
  }
  
  // Try Binance US API first (works from this server location)
  const missing = tokenIds.filter(id => !results[id]);
  for (const tokenId of missing) {
    const symbol = BINANCE_US_SYMBOL_MAP[tokenId];
    if (symbol) {
      try {
        const response = await fetch(`https://api.binance.us/api/v3/ticker/24hr?symbol=${symbol}`);
        if (response.ok) {
          const data = await response.json();
          if (data.lastPrice) {
            results[tokenId] = {
              price: parseFloat(data.lastPrice),
              change24h: parseFloat(data.priceChangePercent || "0"),
            };
          }
        }
      } catch (e) {
        // Silent fail, will try CoinGecko next
      }
    }
  }
  
  // For still missing tokens, try CoinGecko
  const stillMissing = tokenIds.filter(id => !results[id]);
  if (stillMissing.length > 0) {
    const ids = stillMissing.join(",");
    const url = `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`;
    
    try {
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        if (!data.status?.error_code) {
          for (const tokenId of stillMissing) {
            if (data[tokenId]) {
              results[tokenId] = {
                price: data[tokenId].usd || 0,
                change24h: data[tokenId].usd_24h_change || 0,
              };
            }
          }
        }
      }
    } catch (e) {
      console.error("CoinGecko price fetch failed:", e);
    }
  }
  
  // Final fallback to database cache
  const remaining = tokenIds.filter(id => !results[id]);
  if (remaining.length > 0) {
    for (const tokenId of remaining) {
      const cachedToken = await storage.getToken(tokenId);
      if (cachedToken?.currentPrice) {
        results[tokenId] = {
          price: parseFloat(cachedToken.currentPrice),
          change24h: parseFloat(cachedToken.priceChange24h || "0"),
        };
      }
    }
  }
  
  // Update cache with fresh prices
  if (Object.keys(results).length > 0) {
    const allPrices = { ...cachedPrices, ...results };
    setCachedData(cacheKey, allPrices, 10 * 1000); // 10s cache for real-time
  }
  
  return results;
}

// Helper to update batch price cache (called when tokens are fetched)
export function updateBatchPriceCache(tokens: Array<{ id: string; currentPrice: string; priceChange24h: string | null }>) {
  const prices: Record<string, { price: number; change24h: number }> = {};
  for (const token of tokens) {
    prices[token.id] = {
      price: parseFloat(token.currentPrice),
      change24h: parseFloat(token.priceChange24h || "0"),
    };
  }
  setCachedData("batch_prices", prices, 30 * 1000);
}

// Fetch top tokens from CoinGecko
export async function fetchTopTokens(): Promise<InsertToken[]> {
  const cacheKey = "top_tokens";
  const cached = getCached<InsertToken[]>(cacheKey, TOKEN_LIST_CACHE_TTL);
  if (cached) return cached;

  try {
    const response = await fetchWithRetry(
      "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=50&page=1&sparkline=false"
    );

    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status}`);
    }

    const data = await response.json();

    const allTokens: InsertToken[] = data.map((coin: any) => ({
      id: coin.id,
      symbol: coin.symbol,
      name: coin.name,
      image: coin.image,
      currentPrice: coin.current_price?.toString() || "0",
      priceChange24h: coin.price_change_percentage_24h?.toString() || "0",
      volume24h: coin.total_volume?.toString() || "0",
      marketCap: coin.market_cap?.toString() || "0",
      isPinned: PINNED_SYMBOLS.includes(coin.symbol.toLowerCase()),
    }));

    // Filter out stablecoins - only volatile assets allowed for trading
    const tokens = allTokens.filter((token) => !STABLECOIN_IDS.includes(token.id));

    // Ensure pinned tokens are included even if not in top 50
    const pinnedMissing = PINNED_SYMBOLS.filter(
      (symbol) => !tokens.some((t) => t.symbol.toLowerCase() === symbol)
    );

    // For MVP, we'll just use what CoinGecko returns
    // In production, we'd fetch missing pinned tokens separately

    setCache(cacheKey, tokens);

    // Also update database
    await storage.upsertTokens(tokens);

    return tokens;
  } catch (error) {
    console.error("Failed to fetch tokens:", error);
    // Return cached tokens from database
    return (await storage.getTokens()) as InsertToken[];
  }
}

// Fetch single token price - uses Binance first (higher rate limits), then CoinGecko as fallback
export async function fetchTokenPrice(tokenId: string): Promise<{
  price: number;
  change24h: number;
} | null> {
  const cacheKey = `price_${tokenId}`;
  const cached = getCached<{ price: number; change24h: number }>(cacheKey, TICKER_CACHE_TTL);
  if (cached) return cached;

  // Try Binance first (higher rate limits, no API key needed)
  const binanceSymbol = BINANCE_SYMBOL_MAP[tokenId];
  if (binanceSymbol) {
    try {
      const response = await fetch(
        `https://api.binance.com/api/v3/ticker/24hr?symbol=${binanceSymbol}`
      );
      if (response.ok) {
        const data = await response.json();
        const result = {
          price: parseFloat(data.lastPrice) || 0,
          change24h: parseFloat(data.priceChangePercent) || 0,
        };
        if (result.price > 0) {
          setCache(cacheKey, result);
          return result;
        }
      }
    } catch (e) {
      // Fall through to CoinGecko
    }
  }

  // Fallback to CoinGecko
  try {
    const response = await fetchWithRetry(
      `https://api.coingecko.com/api/v3/simple/price?ids=${tokenId}&vs_currencies=usd&include_24hr_change=true`
    );

    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status}`);
    }

    const data = await response.json();

    if (!data[tokenId]) {
      return null;
    }

    const result = {
      price: data[tokenId].usd || 0,
      change24h: data[tokenId].usd_24h_change || 0,
    };

    setCache(cacheKey, result);
    return result;
  } catch (error) {
    // Final fallback: use stored token price from database
    const token = await storage.getToken(tokenId);
    if (token) {
      return {
        price: parseFloat(token.currentPrice || "0"),
        change24h: parseFloat(token.priceChange24h || "0"),
      };
    }
    return null;
  }
}

interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
}

// Timeframe configurations
export type Timeframe = "1m" | "5m" | "15m" | "1h" | "4h" | "1d" | "1w" | "1M";

interface TimeframeConfig {
  binanceInterval: string;
  coingeckoDays: number;
  limit: number;
}

const TIMEFRAME_CONFIG: Record<Timeframe, TimeframeConfig> = {
  "1m": { binanceInterval: "1m", coingeckoDays: 1, limit: 500 },
  "5m": { binanceInterval: "5m", coingeckoDays: 1, limit: 300 },
  "15m": { binanceInterval: "15m", coingeckoDays: 3, limit: 200 },
  "1h": { binanceInterval: "1h", coingeckoDays: 14, limit: 200 },
  "4h": { binanceInterval: "4h", coingeckoDays: 30, limit: 150 },
  "1d": { binanceInterval: "1d", coingeckoDays: 180, limit: 150 },
  "1w": { binanceInterval: "1w", coingeckoDays: 730, limit: 100 },
  "1M": { binanceInterval: "1M", coingeckoDays: 1095, limit: 60 },
};

// Fetch candles from Binance (primary) or CoinGecko (fallback)
export async function fetchCandles(tokenId: string, timeframe: Timeframe = "1h"): Promise<Candle[]> {
  const config = TIMEFRAME_CONFIG[timeframe] || TIMEFRAME_CONFIG["1h"];
  const cacheKey = `candles_${tokenId}_${timeframe}`;
  const cached = getCached<Candle[]>(cacheKey, CANDLE_CACHE_TTL);
  if (cached) return cached;

  // Try Binance first
  const binanceSymbol = BINANCE_SYMBOL_MAP[tokenId];
  if (binanceSymbol) {
    try {
      const response = await fetchWithRetry(
        `https://api.binance.com/api/v3/klines?symbol=${binanceSymbol}&interval=${config.binanceInterval}&limit=${config.limit}`
      );

      if (response.ok) {
        const data = await response.json();
        const candles: Candle[] = data.map((k: any[]) => ({
          time: Math.floor(k[0] / 1000),
          open: parseFloat(k[1]),
          high: parseFloat(k[2]),
          low: parseFloat(k[3]),
          close: parseFloat(k[4]),
        }));

        setCache(cacheKey, candles);
        return candles;
      }
    } catch (error) {
      console.error(`Binance candle fetch failed for ${tokenId}:`, error);
    }
  }

  // Fallback to CoinGecko OHLC
  try {
    const response = await fetchWithRetry(
      `https://api.coingecko.com/api/v3/coins/${tokenId}/ohlc?vs_currency=usd&days=${config.coingeckoDays}`
    );

    if (response.ok) {
      const data = await response.json();
      const candles: Candle[] = data.map((k: number[]) => ({
        time: Math.floor(k[0] / 1000),
        open: k[1],
        high: k[2],
        low: k[3],
        close: k[4],
      }));

      setCache(cacheKey, candles);
      return candles;
    }
  } catch (error) {
    console.error(`CoinGecko OHLC fetch failed for ${tokenId}:`, error);
  }

  return [];
}

// Calculate technical indicators
export function calculateIndicators(candles: Candle[]): {
  ema20: number | null;
  ema50: number | null;
  rsi14: number | null;
} {
  if (candles.length < 50) {
    return { ema20: null, ema50: null, rsi14: null };
  }

  const closes = candles.map((c) => c.close);

  // EMA calculation
  const calculateEMA = (period: number): number => {
    const k = 2 / (period + 1);
    let ema = closes.slice(0, period).reduce((a, b) => a + b, 0) / period;
    for (let i = period; i < closes.length; i++) {
      ema = closes[i] * k + ema * (1 - k);
    }
    return ema;
  };

  // RSI calculation
  const calculateRSI = (period: number): number => {
    let gains = 0;
    let losses = 0;

    for (let i = closes.length - period; i < closes.length; i++) {
      const diff = closes[i] - closes[i - 1];
      if (diff >= 0) {
        gains += diff;
      } else {
        losses -= diff;
      }
    }

    const avgGain = gains / period;
    const avgLoss = losses / period;

    if (avgLoss === 0) return 100;
    const rs = avgGain / avgLoss;
    return 100 - 100 / (1 + rs);
  };

  return {
    ema20: calculateEMA(20),
    ema50: calculateEMA(50),
    rsi14: calculateRSI(14),
  };
}
