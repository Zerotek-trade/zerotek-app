import { useEffect, useRef, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Loader2,
  X,
  Droplets,
  ArrowRight,
} from "lucide-react";

type Timeframe = "1" | "5" | "15" | "60" | "240" | "D" | "W" | "M";

const TIMEFRAMES: { value: Timeframe; label: string }[] = [
  { value: "1", label: "1m" },
  { value: "5", label: "5m" },
  { value: "15", label: "15m" },
  { value: "60", label: "1h" },
  { value: "240", label: "4h" },
  { value: "D", label: "1d" },
  { value: "W", label: "1w" },
  { value: "M", label: "1mo" },
];

const MARGIN_PERCENTAGES = [10, 25, 50, 75, 100];

const SYMBOL_MAP: Record<string, string> = {
  bitcoin: "BINANCE:BTCUSDT",
  ethereum: "BINANCE:ETHUSDT",
  solana: "BINANCE:SOLUSDT",
  binancecoin: "BINANCE:BNBUSDT",
  "ripple": "BINANCE:XRPUSDT",
  cardano: "BINANCE:ADAUSDT",
  dogecoin: "BINANCE:DOGEUSDT",
  polkadot: "BINANCE:DOTUSDT",
  avalanche: "BINANCE:AVAXUSDT",
  chainlink: "BINANCE:LINKUSDT",
  matic: "BINANCE:MATICUSDT",
  litecoin: "BINANCE:LTCUSDT",
  sui: "BINANCE:SUIUSDT",
  pepe: "BINANCE:PEPEUSDT",
  tron: "BINANCE:TRXUSDT",
  shiba: "BINANCE:SHIBUSDT",
  "shiba-inu": "BINANCE:SHIBUSDT",
  uniswap: "BINANCE:UNIUSDT",
  toncoin: "BINANCE:TONUSDT",
  stellar: "BINANCE:XLMUSDT",
  near: "BINANCE:NEARUSDT",
  aptos: "BINANCE:APTUSDT",
  arbitrum: "BINANCE:ARBUSDT",
  optimism: "BINANCE:OPUSDT",
  hedera: "BINANCE:HBARUSDT",
  cosmos: "BINANCE:ATOMUSDT",
  filecoin: "BINANCE:FILUSDT",
  immutable: "BINANCE:IMXUSDT",
  render: "BINANCE:RENDERUSDT",
  injective: "BINANCE:INJUSDT",
  vechain: "BINANCE:VETUSDT",
  fantom: "BINANCE:FTMUSDT",
  theta: "BINANCE:THETAUSDT",
  algorand: "BINANCE:ALGOUSDT",
  flow: "BINANCE:FLOWUSDT",
  aave: "BINANCE:AAVEUSDT",
  "the-sandbox": "BINANCE:SANDUSDT",
  gala: "BINANCE:GALAUSDT",
  eos: "BINANCE:EOSUSDT",
  mana: "BINANCE:MANAUSDT",
  decentraland: "BINANCE:MANAUSDT",
  axie: "BINANCE:AXSUSDT",
  "axie-infinity": "BINANCE:AXSUSDT",
};

const UNSUPPORTED_SYMBOLS = new Set([
  "world-liberty-financial",
  "wlfi",
]);

interface TokenData {
  token: {
    id: string;
    symbol: string;
    name: string;
    currentPrice: string;
    priceChange24h: string;
    volume24h: string;
  };
  candles: {
    time: number;
    open: number;
    high: number;
    low: number;
    close: number;
  }[];
  indicators: {
    ema20: number | null;
    ema50: number | null;
    rsi14: number | null;
  };
  positions: {
    id: string;
    side: string;
    entryPrice: string;
    quantity: string;
    leverage: number;
    margin: string;
    unrealizedPnl: string;
    liquidationPrice: string;
  }[];
  balance: number;
}

export default function Trade() {
  const [, params] = useRoute("/app/trade/:symbol");
  const symbol = params?.symbol || "bitcoin";
  const { toast } = useToast();
  const chartContainerRef = useRef<HTMLDivElement>(null);

  const [orderSide, setOrderSide] = useState<"long" | "short">("long");
  const [leverage, setLeverage] = useState(5);
  const [margin, setMargin] = useState("");
  const [marginPercent, setMarginPercent] = useState(0);
  const [takeProfit, setTakeProfit] = useState("");
  const [stopLoss, setStopLoss] = useState("");
  const [timeframe, setTimeframe] = useState<Timeframe>("60");

  const { data, isLoading, error } = useQuery<TokenData>({
    queryKey: ["/api/trade", symbol, { timeframe: timeframe === "60" ? "1h" : timeframe === "240" ? "4h" : timeframe === "D" ? "1d" : timeframe === "W" ? "1w" : timeframe === "M" ? "1M" : `${timeframe}m` }],
    refetchInterval: 10000,
  });

  const openPosition = useMutation({
    mutationFn: (order: any) => apiRequest("POST", "/api/positions", order),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trade", symbol], exact: false });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["/api/agent/events"] });
      setMargin("");
      setTakeProfit("");
      setStopLoss("");
      toast({ title: "position opened", description: `${orderSide} position created successfully` });
    },
    onError: (err: any) => {
      toast({ title: "error", description: err.message || "failed to open position", variant: "destructive" });
    },
  });

  const closePosition = useMutation({
    mutationFn: (positionId: string) => apiRequest("POST", `/api/positions/${positionId}/close`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trade", symbol], exact: false });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["/api/agent/events"] });
      toast({ title: "position closed" });
    },
    onError: (err: any) => {
      toast({ title: "error", description: err.message || "failed to close position", variant: "destructive" });
    },
  });

  const isUnsupportedSymbol = UNSUPPORTED_SYMBOLS.has(symbol) || !SYMBOL_MAP[symbol];

  // TradingView widget setup
  useEffect(() => {
    if (!chartContainerRef.current) return;
    
    // Skip chart setup for unsupported symbols
    if (isUnsupportedSymbol) {
      const container = chartContainerRef.current;
      container.innerHTML = "";
      return;
    }

    const container = chartContainerRef.current;
    container.innerHTML = "";

    const tvSymbol = SYMBOL_MAP[symbol] || `BINANCE:${symbol.toUpperCase()}USDT`;
    
    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
    script.type = "text/javascript";
    script.async = true;
    script.innerHTML = JSON.stringify({
      autosize: true,
      symbol: tvSymbol,
      interval: timeframe,
      timezone: "Etc/UTC",
      theme: document.documentElement.classList.contains("dark") ? "dark" : "light",
      style: "1",
      locale: "en",
      enable_publishing: false,
      allow_symbol_change: false,
      hide_top_toolbar: false,
      hide_legend: false,
      save_image: false,
      hide_volume: false,
      support_host: "https://www.tradingview.com",
    });

    const widgetContainer = document.createElement("div");
    widgetContainer.className = "tradingview-widget-container";
    widgetContainer.style.height = "100%";
    widgetContainer.style.width = "100%";

    const widgetInner = document.createElement("div");
    widgetInner.className = "tradingview-widget-container__widget";
    widgetInner.style.height = "calc(100% - 32px)";
    widgetInner.style.width = "100%";

    widgetContainer.appendChild(widgetInner);
    widgetContainer.appendChild(script);
    container.appendChild(widgetContainer);

    return () => {
      container.innerHTML = "";
    };
  }, [symbol, timeframe]);

  const price = parseFloat(data?.token?.currentPrice || "0");
  const change = parseFloat(data?.token?.priceChange24h || "0");
  const isPositive = change >= 0;

  const positionSize = margin && leverage ? (parseFloat(margin) * leverage) / price : 0;
  const estimatedLiquidation = margin && leverage && price
    ? orderSide === "long"
      ? price * (1 - 0.9 / leverage)
      : price * (1 + 0.9 / leverage)
    : 0;

  const handleMarginPercentChange = (percent: number) => {
    const balance = data?.balance || 0;
    const amount = (balance * percent) / 100;
    setMargin(amount.toFixed(2));
    setMarginPercent(percent);
  };

  const handleMarginInputChange = (value: string) => {
    setMargin(value);
    const balance = data?.balance || 0;
    if (balance > 0 && value) {
      const percent = (parseFloat(value) / balance) * 100;
      setMarginPercent(Math.min(100, Math.max(0, percent)));
    } else {
      setMarginPercent(0);
    }
  };

  const handleSubmit = () => {
    if (!margin || parseFloat(margin) <= 0) {
      toast({ title: "error", description: "enter a valid margin amount", variant: "destructive" });
      return;
    }
    if (parseFloat(margin) > (data?.balance || 0)) {
      toast({ title: "error", description: "insufficient balance", variant: "destructive" });
      return;
    }

    openPosition.mutate({
      tokenId: symbol,
      side: orderSide,
      leverage,
      margin: parseFloat(margin),
      takeProfit: takeProfit ? parseFloat(takeProfit) : null,
      stopLoss: stopLoss ? parseFloat(stopLoss) : null,
    });
  };

  if (error) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">failed to load token data</p>
            <Button asChild variant="outline" className="mt-4">
              <Link href="/app/markets">back to markets</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const needsFaucet = data && data.balance === 0;

  if (needsFaucet && !isLoading) {
    return (
      <div className="p-6">
        <Card className="glass-card border-primary/20 max-w-lg mx-auto">
          <CardContent className="py-12">
            <div className="text-center space-y-6">
              <div className="flex justify-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Droplets className="h-8 w-8" />
                </div>
              </div>
              <div>
                <h2 className="text-lg font-medium mb-2">claim balance first</h2>
                <p className="text-muted-foreground text-sm">
                  you need test balance to start trading. claim 10,000 usdt from the faucet to begin.
                </p>
              </div>
              <div className="flex flex-col gap-3">
                <Link href="/app/faucet">
                  <Button className="btn-premium w-full" data-testid="link-faucet-from-trade">
                    go to faucet
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
                <Button asChild variant="outline">
                  <Link href="/app/markets" data-testid="link-back-to-markets">
                    back to markets
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* header */}
      <div className="flex items-center gap-4">
        <Button asChild variant="ghost" size="icon">
          <Link href="/app/markets" data-testid="button-back">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        {isLoading ? (
          <Skeleton className="h-8 w-48" />
        ) : (
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-medium uppercase">
              {data?.token?.symbol}/usdt
            </h1>
            <Badge variant="outline" className={isPositive ? "text-positive" : "text-negative"}>
              {isPositive ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
              {change >= 0 ? "+" : ""}{change.toFixed(2)}%
            </Badge>
          </div>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* chart + indicators */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="glass-card overflow-hidden">
            <CardHeader className="pb-2 px-4 pt-4">
              <div className="flex items-center gap-2 flex-wrap" data-testid="timeframe-selector">
                {TIMEFRAMES.map((tf) => (
                  <Button
                    key={tf.value}
                    variant={timeframe === tf.value ? "default" : "ghost"}
                    size="sm"
                    className="text-xs font-mono"
                    onClick={() => setTimeframe(tf.value)}
                    data-testid={`button-timeframe-${tf.value}`}
                  >
                    {tf.label}
                  </Button>
                ))}
              </div>
            </CardHeader>
            <CardContent className="p-0 relative">
              {isUnsupportedSymbol ? (
                <div className="w-full flex flex-col items-center justify-center text-center p-8" style={{ height: 500 }}>
                  <div className="p-4 rounded-full bg-muted/50 mb-4">
                    <TrendingUp className="h-12 w-12 text-muted-foreground/50" />
                  </div>
                  <h3 className="text-lg font-medium mb-2">chart not available</h3>
                  <p className="text-muted-foreground text-sm max-w-md mb-4">
                    this token doesn't have chart data on binance. you can still trade using the order panel on the right.
                  </p>
                  <p className="text-xs text-muted-foreground">
                    current price: ${price > 0 ? price.toFixed(price < 1 ? 6 : 2) : "—"}
                  </p>
                </div>
              ) : (
                <div ref={chartContainerRef} className="w-full" style={{ height: 500 }} />
              )}
            </CardContent>
          </Card>

          {/* indicators */}
          <div className="grid grid-cols-3 gap-4">
            <Card className="glass-card">
              <CardContent className="p-4 text-center">
                <p className="text-xs text-muted-foreground mb-1">ema 20</p>
                <p className="font-mono font-medium">
                  {data?.indicators?.ema20?.toFixed(2) || "—"}
                </p>
              </CardContent>
            </Card>
            <Card className="glass-card">
              <CardContent className="p-4 text-center">
                <p className="text-xs text-muted-foreground mb-1">ema 50</p>
                <p className="font-mono font-medium">
                  {data?.indicators?.ema50?.toFixed(2) || "—"}
                </p>
              </CardContent>
            </Card>
            <Card className="glass-card">
              <CardContent className="p-4 text-center">
                <p className="text-xs text-muted-foreground mb-1">rsi 14</p>
                <p className={`font-mono font-medium ${
                  data?.indicators?.rsi14 
                    ? data.indicators.rsi14 > 70 
                      ? "text-negative" 
                      : data.indicators.rsi14 < 30 
                        ? "text-positive" 
                        : ""
                    : ""
                }`}>
                  {data?.indicators?.rsi14?.toFixed(1) || "—"}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* positions */}
          {data?.positions && data.positions.length > 0 && (
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="text-base">open positions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {data.positions.map((pos) => {
                  const pnl = parseFloat(pos.unrealizedPnl);
                  return (
                    <div key={pos.id} className="flex items-center justify-between p-3 rounded-md bg-muted/50">
                      <div className="flex items-center gap-3">
                        <Badge variant={pos.side === "long" ? "default" : "destructive"}>
                          {pos.side} {pos.leverage}x
                        </Badge>
                        <div>
                          <p className="text-sm font-medium">
                            {parseFloat(pos.quantity).toFixed(4)} @ ${parseFloat(pos.entryPrice).toFixed(2)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            margin: ${parseFloat(pos.margin).toFixed(2)} · liq: ${parseFloat(pos.liquidationPrice).toFixed(2)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`font-mono font-medium ${pnl >= 0 ? "text-positive" : "text-negative"}`}>
                          {pnl >= 0 ? "+" : ""}${pnl.toFixed(2)}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => closePosition.mutate(pos.id)}
                          disabled={closePosition.isPending}
                          data-testid={`button-close-position-${pos.id}`}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}
        </div>

        {/* order panel */}
        <div className="space-y-4">
          <Card className="glass-card">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="text-base">place order</CardTitle>
                <span className="text-sm text-muted-foreground">
                  bal: ${(data?.balance || 0).toFixed(2)}
                </span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* side tabs */}
              <Tabs value={orderSide} onValueChange={(v) => setOrderSide(v as "long" | "short")}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="long" data-testid="tab-long" className="data-[state=active]:bg-emerald-500 data-[state=active]:text-white">
                    long
                  </TabsTrigger>
                  <TabsTrigger value="short" data-testid="tab-short" className="data-[state=active]:bg-red-500 data-[state=active]:text-white">
                    short
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              {/* leverage */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm">leverage</Label>
                  <span className="text-sm font-mono">{leverage}x</span>
                </div>
                <Slider
                  value={[leverage]}
                  onValueChange={([v]) => setLeverage(v)}
                  min={1}
                  max={25}
                  step={1}
                  data-testid="slider-leverage"
                />
              </div>

              {/* margin */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm" data-testid="label-margin">margin (usdt)</Label>
                  <span className="text-xs text-muted-foreground font-mono" data-testid="text-margin-percent">{marginPercent.toFixed(0)}%</span>
                </div>
                <Input
                  type="number"
                  value={margin}
                  onChange={(e) => handleMarginInputChange(e.target.value)}
                  placeholder="0.00"
                  data-testid="input-margin"
                />
                <Slider
                  value={[marginPercent]}
                  onValueChange={([v]) => handleMarginPercentChange(v)}
                  min={0}
                  max={100}
                  step={1}
                  data-testid="slider-margin-percent"
                />
                <div className="flex gap-1" data-testid="margin-percent-buttons">
                  {MARGIN_PERCENTAGES.map((pct) => (
                    <Button
                      key={pct}
                      variant={Math.abs(marginPercent - pct) < 1 ? "default" : "outline"}
                      size="sm"
                      className="flex-1 text-xs font-mono"
                      onClick={() => handleMarginPercentChange(pct)}
                      data-testid={`button-margin-${pct}`}
                    >
                      {pct}%
                    </Button>
                  ))}
                </div>
              </div>

              {/* tp/sl */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-sm">take profit</Label>
                  <Input
                    type="number"
                    value={takeProfit}
                    onChange={(e) => setTakeProfit(e.target.value)}
                    placeholder="optional"
                    data-testid="input-take-profit"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm">stop loss</Label>
                  <Input
                    type="number"
                    value={stopLoss}
                    onChange={(e) => setStopLoss(e.target.value)}
                    placeholder="optional"
                    data-testid="input-stop-loss"
                  />
                </div>
              </div>

              {/* summary */}
              {margin && parseFloat(margin) > 0 && (
                <div className="space-y-2 p-3 rounded-md bg-muted/50 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">position size</span>
                    <span className="font-mono">{positionSize.toFixed(4)} {data?.token?.symbol?.toUpperCase()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">est. liquidation</span>
                    <span className="font-mono">${estimatedLiquidation.toFixed(2)}</span>
                  </div>
                </div>
              )}

              {/* submit */}
              <Button
                className={`w-full ${orderSide === "long" ? "bg-emerald-500 hover:bg-emerald-600" : "bg-red-500 hover:bg-red-600"} text-white`}
                onClick={handleSubmit}
                disabled={openPosition.isPending || !margin || parseFloat(margin) <= 0}
                data-testid="button-submit-order"
              >
                {openPosition.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                {orderSide === "long" ? "open long" : "open short"}
              </Button>
            </CardContent>
          </Card>

          {/* price info */}
          <Card className="glass-card">
            <CardContent className="p-4 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">current price</span>
                <span className="font-mono font-medium">${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">24h change</span>
                <span className={`font-mono ${isPositive ? "text-positive" : "text-negative"}`}>
                  {change >= 0 ? "+" : ""}{change.toFixed(2)}%
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">24h volume</span>
                <span className="font-mono">${parseFloat(data?.token?.volume24h || "0").toLocaleString()}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
