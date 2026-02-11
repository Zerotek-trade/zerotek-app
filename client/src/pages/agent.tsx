import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  Bot,
  Play,
  Pause,
  XCircle,
  Settings2,
  TrendingUp,
  TrendingDown,
  Zap,
  BarChart3,
  Loader2,
  Clock,
  AlertCircle,
  Target,
  Activity,
  DollarSign,
  Percent,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  Layers,
  Check,
} from "lucide-react";

interface AgentConfig {
  id: string;
  allowedPairs: string[];
  maxCapital: string;
  maxLeverage: number;
  maxLossPerDay: string;
  maxOpenPositions: number;
  tradeFrequencyMinutes: number;
  strategy: string;
  useEmaFilter: boolean;
  useRsiFilter: boolean;
  useVolatilityFilter: boolean;
  maxMarginPerTrade: string;
  useRandomMargin: boolean;
  status: string;
  lastRunAt: string | null;
}

interface Token {
  id: string;
  symbol: string;
  name: string;
}

interface AgentStats {
  totalTrades: number;
  winTrades: number;
  lossTrades: number;
  totalProfit: string;
  accuracy: string;
  openPositions: number;
}

interface AgentPosition {
  id: string;
  tokenId: string;
  side: string;
  entryPrice: string;
  currentPrice: string;
  quantity: string;
  leverage: number;
  margin: string;
  unrealizedPnl: string;
  roe: string;
  liquidationPrice: string;
  takeProfit: string | null;
  stopLoss: string | null;
  tokenName: string;
  tokenSymbol: string;
  tokenImage: string | null;
  createdAt: string;
}

interface AgentEvent {
  id: string;
  type: string;
  symbol: string | null;
  message: string;
  createdAt: string;
}

export default function Agent() {
  const { toast } = useToast();

  const { data: config, isLoading } = useQuery<AgentConfig>({
    queryKey: ["/api/agent/config"],
  });

  const { data: tokens } = useQuery<Token[]>({
    queryKey: ["/api/tokens"],
  });

  const { data: stats, refetch: refetchStats } = useQuery<AgentStats>({
    queryKey: ["/api/agent/stats"],
    refetchInterval: 10000,
  });

  const { data: agentPositions, refetch: refetchPositions } = useQuery<AgentPosition[]>({
    queryKey: ["/api/agent/positions"],
    refetchInterval: 5000,
  });

  const { data: events, refetch: refetchEvents } = useQuery<AgentEvent[]>({
    queryKey: ["/api/agent/events"],
    refetchInterval: 5000,
  });

  const updateConfig = useMutation({
    mutationFn: (updates: Partial<AgentConfig>) => apiRequest("PATCH", "/api/agent/config", updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/agent/config"] });
      toast({ title: "saved", description: "agent configuration updated" });
    },
    onError: (err: any) => {
      toast({ title: "error", description: err.message, variant: "destructive" });
    },
  });

  const startAgent = useMutation({
    mutationFn: () => apiRequest("POST", "/api/agent/start"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/agent/config"] });
      queryClient.invalidateQueries({ queryKey: ["/api/agent/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/agent/positions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/agent/events"] });
      toast({ title: "agent started", description: "automation is now running - scanning for signals..." });
    },
    onError: (err: any) => {
      toast({ title: "error", description: err.message, variant: "destructive" });
    },
  });

  const pauseAgent = useMutation({
    mutationFn: () => apiRequest("POST", "/api/agent/pause"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/agent/config"] });
      queryClient.invalidateQueries({ queryKey: ["/api/agent/stats"] });
      toast({ title: "agent paused" });
    },
  });

  const closeAllAgentPositions = useMutation({
    mutationFn: () => apiRequest("POST", "/api/agent/close-all"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/agent/config"] });
      queryClient.invalidateQueries({ queryKey: ["/api/agent/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/agent/positions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/agent/events"] });
      queryClient.invalidateQueries({ queryKey: ["/api/faucet"] });
      toast({ title: "positions closed", description: "all agent positions have been closed" });
    },
  });

  const [localConfig, setLocalConfig] = useState<Partial<AgentConfig>>({});

  const currentConfig = { ...config, ...localConfig };
  const isRunning = config?.status === "running";

  const handleSave = () => {
    if (Object.keys(localConfig).length > 0) {
      updateConfig.mutate(localConfig);
      setLocalConfig({});
    }
  };

  const refreshAll = () => {
    refetchStats();
    refetchPositions();
    refetchEvents();
    queryClient.invalidateQueries({ queryKey: ["/api/agent/config"] });
  };

  const strategies = [
    { value: "trend", label: "trend following", icon: TrendingUp, description: "follows established price trends using moving averages" },
    { value: "breakout", label: "breakout", icon: Zap, description: "enters positions on price breakouts from consolidation" },
    { value: "mean_reversion", label: "mean reversion", icon: BarChart3, description: "trades reversals when price deviates from average" },
    { value: "momentum", label: "momentum", icon: Activity, description: "trades based on strong price momentum and volume" },
    { value: "scalping", label: "scalping", icon: RefreshCw, description: "quick trades capturing small price movements" },
    { value: "grid", label: "grid trading", icon: Layers, description: "places orders at regular intervals above and below price" },
    { value: "dca", label: "dca (dollar cost avg)", icon: DollarSign, description: "accumulates positions over time at different prices" },
  ];
  
  // Parse strategies - can be comma-separated string or array
  const parseStrategies = (value: string | string[] | undefined): string[] => {
    if (!value) return ["trend"];
    if (Array.isArray(value)) return value;
    return value.split(",").filter(Boolean);
  };
  
  const selectedStrategies = parseStrategies(localConfig.strategy ?? config?.strategy);
  
  const toggleStrategy = (strategyValue: string) => {
    let current = [...selectedStrategies];
    if (current.includes(strategyValue)) {
      current = current.filter(s => s !== strategyValue);
      if (current.length === 0) current = ["trend"]; // Must have at least one
    } else {
      if (current.length >= 3) {
        // Remove oldest, add new
        current.shift();
      }
      current.push(strategyValue);
    }
    setLocalConfig({ ...localConfig, strategy: current.join(",") });
  };

  const getNextEvaluationTime = () => {
    if (!config?.lastRunAt || !config?.tradeFrequencyMinutes) return null;
    const lastRun = new Date(config.lastRunAt);
    const nextRun = new Date(lastRun.getTime() + config.tradeFrequencyMinutes * 60 * 1000);
    const now = new Date();
    const diff = nextRun.getTime() - now.getTime();
    if (diff <= 0) return "evaluating soon";
    const mins = Math.ceil(diff / 60000);
    return `${mins}m`;
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 lg:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="glass-card">
              <CardContent className="p-6">
                <Skeleton className="h-32 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const allowedPairsCount = (currentConfig.allowedPairs || []).length;
  const profit = parseFloat(stats?.totalProfit || "0");
  const accuracy = parseFloat(stats?.accuracy || "0");

  return (
    <div className="p-6 space-y-6">
      {/* header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-medium flex items-center gap-2">
            <Bot className="h-5 w-5" />
            automation agent
          </h1>
          <p className="text-sm text-muted-foreground">
            rule-based trading automation with separate position tracking
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <Button variant="ghost" size="icon" onClick={refreshAll} data-testid="button-refresh">
            <RefreshCw className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2">
            <div className={`status-dot ${isRunning ? "running" : "paused"}`} />
            <Badge variant={isRunning ? "default" : "secondary"} className={isRunning ? "bg-primary" : ""}>
              {isRunning ? "running" : "paused"}
            </Badge>
          </div>
          {config?.lastRunAt && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              last: {new Date(config.lastRunAt).toLocaleTimeString()}
            </div>
          )}
          {isRunning && getNextEvaluationTime() && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <AlertCircle className="h-3.5 w-3.5" />
              next: {getNextEvaluationTime()}
            </div>
          )}
        </div>
      </div>

      {/* performance stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="glass-card">
          <CardContent className="p-4 flex items-center gap-3">
            <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${profit >= 0 ? "bg-green-500/10" : "bg-red-500/10"}`}>
              <DollarSign className={`h-5 w-5 ${profit >= 0 ? "text-green-500" : "text-red-500"}`} />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">total profit</p>
              <p className={`text-lg font-mono font-medium ${profit >= 0 ? "text-green-500" : "text-red-500"}`}>
                {profit >= 0 ? "+" : ""}{stats?.totalProfit || "0.00"}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Target className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">accuracy</p>
              <p className="text-lg font-mono font-medium">{stats?.accuracy || "0.0"}%</p>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
              <Activity className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">total trades</p>
              <p className="text-lg font-mono font-medium">{stats?.totalTrades || 0}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <BarChart3 className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">win/loss</p>
              <p className="text-lg font-mono font-medium">
                <span className="text-green-500">{stats?.winTrades || 0}</span>
                <span className="text-muted-foreground">/</span>
                <span className="text-red-500">{stats?.lossTrades || 0}</span>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* controls */}
      <Card className={`glass-card ${isRunning ? "border-primary/30" : ""}`}>
        <CardContent className="flex flex-wrap items-center justify-between gap-4 py-4">
          <div className="flex items-center gap-2 flex-wrap">
            {isRunning ? (
              <Button onClick={() => pauseAgent.mutate()} disabled={pauseAgent.isPending} data-testid="button-pause-agent">
                {pauseAgent.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Pause className="h-4 w-4 mr-2" />}
                pause agent
              </Button>
            ) : (
              <Button onClick={() => startAgent.mutate()} disabled={startAgent.isPending} className="btn-premium" data-testid="button-start-agent">
                {startAgent.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Play className="h-4 w-4 mr-2" />}
                start agent
              </Button>
            )}
            <Button variant="outline" onClick={() => closeAllAgentPositions.mutate()} disabled={closeAllAgentPositions.isPending} data-testid="button-close-all-agent">
              {closeAllAgentPositions.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <XCircle className="h-4 w-4 mr-2" />}
              close agent positions
            </Button>
          </div>
          {Object.keys(localConfig).length > 0 && (
            <Button onClick={handleSave} disabled={updateConfig.isPending} className="btn-premium" data-testid="button-save-config">
              {updateConfig.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Settings2 className="h-4 w-4 mr-2" />}
              save changes
            </Button>
          )}
        </CardContent>
      </Card>

      <Tabs defaultValue="positions" className="space-y-4">
        <TabsList className="glass-card">
          <TabsTrigger value="positions" data-testid="tab-positions">
            agent positions ({agentPositions?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="activity" data-testid="tab-activity">
            activity feed
          </TabsTrigger>
          <TabsTrigger value="config" data-testid="tab-config">
            configuration
          </TabsTrigger>
        </TabsList>

        <TabsContent value="positions" className="space-y-4">
          {agentPositions?.length === 0 ? (
            <Card className="glass-card">
              <CardContent className="py-12 text-center text-muted-foreground">
                <Bot className="h-10 w-10 mx-auto mb-3 opacity-50" />
                <p>no agent positions</p>
                <p className="text-xs mt-1">start the agent to begin automated trading</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {agentPositions?.map((pos) => {
                const pnl = parseFloat(pos.unrealizedPnl);
                const roe = parseFloat(pos.roe);
                const isProfit = pnl >= 0;
                return (
                  <Card key={pos.id} className="glass-card" data-testid={`agent-position-${pos.id}`}>
                    <CardContent className="p-4">
                      <div className="flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          {pos.tokenImage && (
                            <img src={pos.tokenImage} alt={pos.tokenSymbol} className="h-8 w-8 rounded-full" />
                          )}
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{pos.tokenSymbol.toUpperCase()}</span>
                              <Badge variant={pos.side === "long" ? "default" : "destructive"} className={pos.side === "long" ? "bg-green-500" : "bg-red-500"}>
                                {pos.side} {pos.leverage}x
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              entry: ${parseFloat(pos.entryPrice).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-6 flex-wrap">
                          <div className="text-right">
                            <p className="text-xs text-muted-foreground">mark price</p>
                            <p className="font-mono">${parseFloat(pos.currentPrice).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-muted-foreground">margin</p>
                            <p className="font-mono">${parseFloat(pos.margin).toFixed(2)}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-muted-foreground">unrealized pnl</p>
                            <div className="flex items-center gap-1">
                              {isProfit ? <ArrowUpRight className="h-3.5 w-3.5 text-green-500" /> : <ArrowDownRight className="h-3.5 w-3.5 text-red-500" />}
                              <span className={`font-mono ${isProfit ? "text-green-500" : "text-red-500"}`}>
                                {isProfit ? "+" : ""}{pnl.toFixed(2)} ({roe.toFixed(1)}%)
                              </span>
                            </div>
                          </div>
                          {pos.takeProfit && (
                            <div className="text-right">
                              <p className="text-xs text-muted-foreground">tp</p>
                              <p className="font-mono text-green-500">${parseFloat(pos.takeProfit).toFixed(2)}</p>
                            </div>
                          )}
                          {pos.stopLoss && (
                            <div className="text-right">
                              <p className="text-xs text-muted-foreground">sl</p>
                              <p className="font-mono text-red-500">${parseFloat(pos.stopLoss).toFixed(2)}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="activity">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Activity className="h-4 w-4" />
                agent activity
              </CardTitle>
              <CardDescription>recent agent actions and signals</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-3">
                  {events?.length === 0 && (
                    <p className="text-center text-muted-foreground py-8">no agent activity yet</p>
                  )}
                  {events?.map((event) => (
                    <div key={event.id} className="flex gap-3 p-3 rounded-lg bg-muted/30" data-testid={`event-${event.id}`}>
                      <div className={`h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                        event.type === "position_opened" ? "bg-blue-500/10 text-blue-500" :
                        event.type === "position_closed" ? "bg-muted" :
                        event.type === "tp_hit" ? "bg-green-500/10 text-green-500" :
                        event.type === "sl_hit" ? "bg-red-500/10 text-red-500" :
                        event.type === "liquidated" ? "bg-red-500/10 text-red-500" :
                        event.type === "scanning" ? "bg-primary/10 text-primary" :
                        "bg-muted"
                      }`}>
                        {event.type === "position_opened" && <TrendingUp className="h-4 w-4" />}
                        {event.type === "position_closed" && <XCircle className="h-4 w-4" />}
                        {event.type === "tp_hit" && <Target className="h-4 w-4" />}
                        {event.type === "sl_hit" && <TrendingDown className="h-4 w-4" />}
                        {event.type === "liquidated" && <AlertCircle className="h-4 w-4" />}
                        {event.type === "scanning" && <Activity className="h-4 w-4" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm">{event.message}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {new Date(event.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="config" className="space-y-6">
          {/* status summary chips */}
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="text-xs">
              {allowedPairsCount} pairs
            </Badge>
            <Badge variant="outline" className="text-xs">
              ${currentConfig.maxCapital || "1000"} cap
            </Badge>
            <Badge variant="outline" className="text-xs">
              {currentConfig.maxLeverage || 5}x leverage
            </Badge>
            <Badge variant="outline" className="text-xs">
              ${currentConfig.maxLossPerDay || "100"}/day loss limit
            </Badge>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* strategy selection */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="text-base">strategies</CardTitle>
                <CardDescription>select up to 3 trading strategies ({selectedStrategies.length}/3 selected)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {strategies.map((s) => {
                  const isSelected = selectedStrategies.includes(s.value);
                  return (
                    <div
                      key={s.value}
                      onClick={() => toggleStrategy(s.value)}
                      className={`p-3 rounded-lg border cursor-pointer transition-all hover:border-primary/30 ${
                        isSelected ? "border-primary bg-primary/5" : "border-border/50"
                      }`}
                      data-testid={`strategy-${s.value}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`h-8 w-8 rounded-md flex items-center justify-center transition-colors ${
                          isSelected ? "bg-primary text-primary-foreground" : "bg-muted"
                        }`}>
                          {isSelected ? <Check className="h-4 w-4" /> : <s.icon className="h-4 w-4" />}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-sm">{s.label}</p>
                          <p className="text-xs text-muted-foreground">{s.description}</p>
                        </div>
                        {isSelected && (
                          <Badge variant="secondary" className="text-xs">active</Badge>
                        )}
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            {/* risk limits */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="text-base">risk limits</CardTitle>
                <CardDescription>set your risk management parameters</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label className="text-sm">max capital (usdt)</Label>
                    <span className="text-sm font-mono text-primary">${currentConfig.maxCapital || "1000"}</span>
                  </div>
                  <Input
                    type="number"
                    value={localConfig.maxCapital ?? config?.maxCapital ?? "1000"}
                    onChange={(e) => setLocalConfig({ ...localConfig, maxCapital: e.target.value })}
                    placeholder="1000"
                    data-testid="input-max-capital"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label className="text-sm">max leverage</Label>
                    <span className="text-sm font-mono text-primary">{currentConfig.maxLeverage || 5}x</span>
                  </div>
                  <Slider
                    value={[localConfig.maxLeverage ?? config?.maxLeverage ?? 5]}
                    onValueChange={([v]) => setLocalConfig({ ...localConfig, maxLeverage: v })}
                    min={1}
                    max={25}
                    step={1}
                    data-testid="slider-max-leverage"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label className="text-sm">max daily loss (usdt)</Label>
                    <span className="text-sm font-mono text-primary">${currentConfig.maxLossPerDay || "100"}</span>
                  </div>
                  <Input
                    type="number"
                    value={localConfig.maxLossPerDay ?? config?.maxLossPerDay ?? "100"}
                    onChange={(e) => setLocalConfig({ ...localConfig, maxLossPerDay: e.target.value })}
                    placeholder="100"
                    data-testid="input-max-loss"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label className="text-sm">max margin per trade (usdt)</Label>
                    <span className="text-sm font-mono text-primary">${currentConfig.maxMarginPerTrade || "300"}</span>
                  </div>
                  <Input
                    type="number"
                    value={localConfig.maxMarginPerTrade ?? config?.maxMarginPerTrade ?? "300"}
                    onChange={(e) => setLocalConfig({ ...localConfig, maxMarginPerTrade: e.target.value })}
                    placeholder="300"
                    data-testid="input-max-margin-per-trade"
                  />
                  <p className="text-xs text-muted-foreground">maximum margin agent will use for a single trade</p>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                  <div>
                    <p className="font-medium text-sm">random margin amounts</p>
                    <p className="text-xs text-muted-foreground">use random margins (100, 250, 300) instead of fixed</p>
                  </div>
                  <Switch
                    checked={localConfig.useRandomMargin ?? config?.useRandomMargin ?? true}
                    onCheckedChange={(v) => setLocalConfig({ ...localConfig, useRandomMargin: v })}
                    data-testid="switch-random-margin"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm">max positions</Label>
                    <Select
                      value={String(localConfig.maxOpenPositions ?? config?.maxOpenPositions ?? 3)}
                      onValueChange={(v) => setLocalConfig({ ...localConfig, maxOpenPositions: parseInt(v) })}
                    >
                      <SelectTrigger data-testid="select-max-positions">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[1, 2, 3, 5, 10].map((n) => (
                          <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm">trade cooldown</Label>
                    <Select
                      value={String(localConfig.tradeFrequencyMinutes ?? config?.tradeFrequencyMinutes ?? 30)}
                      onValueChange={(v) => setLocalConfig({ ...localConfig, tradeFrequencyMinutes: parseInt(v) })}
                    >
                      <SelectTrigger data-testid="select-cooldown">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[1, 2, 5, 15, 30, 60].map((n) => (
                          <SelectItem key={n} value={String(n)}>{n} min</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* filters */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="text-base">signal filters</CardTitle>
                <CardDescription>enable additional confirmation filters</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                  <div>
                    <p className="font-medium text-sm">ema filter</p>
                    <p className="text-xs text-muted-foreground">require ema 20/50 alignment</p>
                  </div>
                  <Switch
                    checked={localConfig.useEmaFilter ?? config?.useEmaFilter ?? true}
                    onCheckedChange={(v) => setLocalConfig({ ...localConfig, useEmaFilter: v })}
                    data-testid="switch-ema-filter"
                  />
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                  <div>
                    <p className="font-medium text-sm">rsi filter</p>
                    <p className="text-xs text-muted-foreground">avoid overbought/oversold entries</p>
                  </div>
                  <Switch
                    checked={localConfig.useRsiFilter ?? config?.useRsiFilter ?? true}
                    onCheckedChange={(v) => setLocalConfig({ ...localConfig, useRsiFilter: v })}
                    data-testid="switch-rsi-filter"
                  />
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                  <div>
                    <p className="font-medium text-sm">volatility filter</p>
                    <p className="text-xs text-muted-foreground">skip low volatility periods</p>
                  </div>
                  <Switch
                    checked={localConfig.useVolatilityFilter ?? config?.useVolatilityFilter ?? false}
                    onCheckedChange={(v) => setLocalConfig({ ...localConfig, useVolatilityFilter: v })}
                    data-testid="switch-volatility-filter"
                  />
                </div>
              </CardContent>
            </Card>

            {/* allowed pairs */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="text-base">allowed pairs</CardTitle>
                <CardDescription>select tokens the agent can trade ({allowedPairsCount} selected)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {tokens?.slice(0, 20).map((token) => {
                    const isSelected = (localConfig.allowedPairs ?? config?.allowedPairs ?? []).includes(token.id);
                    return (
                      <Badge
                        key={token.id}
                        variant={isSelected ? "default" : "outline"}
                        className={`cursor-pointer transition-all ${isSelected ? "bg-primary" : "hover:border-primary/50"}`}
                        onClick={() => {
                          const current = localConfig.allowedPairs ?? config?.allowedPairs ?? [];
                          const updated = isSelected
                            ? current.filter((id) => id !== token.id)
                            : [...current, token.id];
                          setLocalConfig({ ...localConfig, allowedPairs: updated });
                        }}
                        data-testid={`pair-${token.symbol}`}
                      >
                        {token.symbol.toUpperCase()}
                      </Badge>
                    );
                  })}
                </div>
                {tokens && tokens.length === 0 && (
                  <p className="text-sm text-muted-foreground">loading tokens...</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
