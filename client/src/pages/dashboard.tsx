import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  Bot,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Droplets,
  ArrowRight,
} from "lucide-react";
import { Link } from "wouter";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from "recharts";
import { useAuth } from "@/hooks/use-auth";

interface DashboardData {
  balance: number;
  equity: number;
  unrealizedPnl: number;
  realizedPnl: number;
  todayPnl: number;
  winRate: number;
  maxDrawdown: number;
  openPositions: number;
  agentPositions: number;
  agentUnrealizedPnl: number;
  manualPositions: number;
  manualUnrealizedPnl: number;
  agentStatus: string;
  equityCurve: { date: string; equity: number }[];
  recentTrades: {
    id: string;
    tokenId: string;
    side: string;
    price: string;
    quantity: string;
    realizedPnl: string | null;
    createdAt: string;
    isAgentTrade?: boolean;
  }[];
  canClaimFaucet?: boolean;
  faucetCooldown?: number | null;
}


export default function Dashboard() {
  const { isAuthenticated } = useAuth();

  const { data, isLoading } = useQuery<DashboardData | null>({
    queryKey: ["/api/dashboard"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    enabled: isAuthenticated,
    refetchInterval: 15000, // Refresh every 15 seconds for live PnL (reduced from 5s)
    staleTime: 10000, // Consider data stale after 10 seconds
  });


  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const formatPnl = (value: number) => {
    const formatted = formatCurrency(Math.abs(value));
    return value >= 0 ? `+${formatted}` : `-${formatted}`;
  };

  const needsFaucet = !data || data.balance === 0;

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Card className="border-primary/20">
          <CardContent className="py-5">
            <div className="flex items-center justify-between gap-4">
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-5 w-48" />
              </div>
              <Skeleton className="h-10 w-32" />
            </div>
          </CardContent>
        </Card>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader><Skeleton className="h-5 w-32" /></CardHeader>
            <CardContent><Skeleton className="h-40 w-full" /></CardContent>
          </Card>
          <Card>
            <CardHeader><Skeleton className="h-5 w-32" /></CardHeader>
            <CardContent>
              <div className="chart-container">
                <div className="chart-skeleton skeleton-pulse">
                  <Activity className="h-8 w-8 text-muted-foreground/30" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const stats = [
    {
      title: "balance",
      value: formatCurrency(data?.balance || 0),
      icon: Wallet,
      trend: null,
    },
    {
      title: "equity",
      value: formatCurrency(data?.equity || 0),
      icon: TrendingUp,
      trend: data?.unrealizedPnl || 0,
    },
    {
      title: "today's pnl",
      value: formatPnl(data?.todayPnl || 0),
      icon: data?.todayPnl && data.todayPnl >= 0 ? ArrowUpRight : ArrowDownRight,
      trend: data?.todayPnl || 0,
    },
    {
      title: "win rate",
      value: `${((data?.winRate || 0) * 100).toFixed(1)}%`,
      icon: TrendingUp,
      trend: null,
    },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* get started card - shown when balance is 0 */}
      {needsFaucet && (
        <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
          <CardContent className="py-5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <Droplets className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-medium">get started</p>
                  <p className="text-sm text-muted-foreground">
                    claim test balance to start trading
                  </p>
                </div>
              </div>
              <Link href="/app/faucet">
                <Button className="btn-premium w-full sm:w-auto" data-testid="link-faucet-cta">
                  claim balance
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* stats grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title} className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div
                className={`text-2xl font-medium ${
                  stat.trend !== null
                    ? stat.trend >= 0
                      ? "text-positive"
                      : "text-negative"
                    : ""
                }`}
              >
                {stat.value}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* positions breakdown + agent status row */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* positions breakdown */}
        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between gap-2">
            <CardTitle className="text-base font-medium">active positions</CardTitle>
            <Badge variant="outline" className="text-xs">
              {data?.openPositions || 0} total
            </Badge>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 rounded-lg bg-muted/50 border border-border/50">
                <div className="flex items-center gap-2 mb-2">
                  <Bot className="h-4 w-4 text-primary" />
                  <p className="text-sm font-medium">agent positions</p>
                </div>
                <p className="text-2xl font-bold mb-1">{data?.agentPositions || 0}</p>
                <p
                  className={`text-sm ${
                    (data?.agentUnrealizedPnl || 0) >= 0 ? "text-positive" : "text-negative"
                  }`}
                >
                  {formatPnl(data?.agentUnrealizedPnl || 0)} pnl
                </p>
              </div>
              <div className="p-3 rounded-lg bg-muted/50 border border-border/50">
                <div className="flex items-center gap-2 mb-2">
                  <Activity className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm font-medium">manual positions</p>
                </div>
                <p className="text-2xl font-bold mb-1">{data?.manualPositions || 0}</p>
                <p
                  className={`text-sm ${
                    (data?.manualUnrealizedPnl || 0) >= 0 ? "text-positive" : "text-negative"
                  }`}
                >
                  {formatPnl(data?.manualUnrealizedPnl || 0)} pnl
                </p>
              </div>
            </div>
            <Button asChild variant="outline" className="w-full">
              <Link href="/app/positions" data-testid="link-view-positions">
                view all positions
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* agent status */}
        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between gap-2">
            <CardTitle className="text-base font-medium">automation agent</CardTitle>
            <div className="flex items-center gap-2">
              <div className={`status-dot ${data?.agentStatus === "running" ? "running" : "paused"}`} />
              <Badge
                variant={data?.agentStatus === "running" ? "default" : "secondary"}
                className={data?.agentStatus === "running" ? "bg-primary" : ""}
              >
                {data?.agentStatus || "paused"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground mb-1">agent positions</p>
                <p className="text-lg font-medium">{data?.agentPositions || 0}</p>
              </div>
              <div>
                <p className="text-muted-foreground mb-1">unrealized pnl</p>
                <p
                  className={`text-lg font-medium ${
                    (data?.agentUnrealizedPnl || 0) >= 0 ? "text-positive" : "text-negative"
                  }`}
                >
                  {formatPnl(data?.agentUnrealizedPnl || 0)}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground mb-1">max drawdown</p>
                <p className="text-lg font-medium text-negative">
                  {((data?.maxDrawdown || 0) * 100).toFixed(1)}%
                </p>
              </div>
            </div>
            <Button asChild variant="outline" className="w-full">
              <Link href="/app/agent" data-testid="link-agent-settings">
                <Bot className="h-4 w-4 mr-2" />
                configure agent
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* equity curve */}
        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between gap-2">
            <CardTitle className="text-base font-medium">equity curve</CardTitle>
            {data?.equityCurve && data.equityCurve.length > 0 && (
              <span className="text-xs text-muted-foreground">
                {data.equityCurve.length} data points
              </span>
            )}
          </CardHeader>
          <CardContent>
            <div className="chart-container">
              {data?.equityCurve && data.equityCurve.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={data.equityCurve}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis 
                      hide 
                      domain={["auto", "auto"]} 
                    />
                    <Tooltip
                      contentStyle={{
                        background: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "6px",
                        fontSize: "12px",
                      }}
                      formatter={(value: number) => [formatCurrency(value), "equity"]}
                    />
                    <Line
                      type="monotone"
                      dataKey="equity"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[200px] flex flex-col items-center justify-center text-center">
                  <Activity className="h-8 w-8 text-muted-foreground/30 mb-3" />
                  <p className="text-sm text-muted-foreground mb-1">no equity data yet</p>
                  <p className="text-xs text-muted-foreground">place a trade to start tracking</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* recent trades */}
      <Card className="glass-card">
        <CardHeader className="flex flex-row items-center justify-between gap-2">
          <CardTitle className="text-base font-medium">recent trades</CardTitle>
          <Button asChild variant="ghost" size="sm">
            <Link href="/app/history" data-testid="link-view-all-trades">
              view all
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {data?.recentTrades && data.recentTrades.length > 0 ? (
            <div className="space-y-2">
              {data.recentTrades.slice(0, 5).map((trade) => (
                <div
                  key={trade.id}
                  className="flex items-center justify-between py-2.5 border-b border-border/50 last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <Badge
                      variant="outline"
                      className={
                        trade.side === "buy"
                          ? "border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
                          : "border-red-500/30 text-red-600 dark:text-red-400"
                      }
                    >
                      {trade.side}
                    </Badge>
                    <div>
                      <p className="font-medium text-sm">
                        {trade.tokenId.toUpperCase()}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(trade.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">
                      {parseFloat(trade.quantity).toFixed(4)} @ $
                      {parseFloat(trade.price).toFixed(2)}
                    </p>
                    {trade.realizedPnl && (
                      <p
                        className={`text-xs ${
                          parseFloat(trade.realizedPnl) >= 0
                            ? "text-positive"
                            : "text-negative"
                        }`}
                      >
                        {parseFloat(trade.realizedPnl) >= 0 ? "+" : ""}
                        ${parseFloat(trade.realizedPnl).toFixed(2)}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-10 text-center">
              <TrendingUp className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground mb-1">no trades yet</p>
              <p className="text-xs text-muted-foreground">
                head to{" "}
                <Link href="/app/markets" className="text-primary hover:underline">
                  markets
                </Link>{" "}
                to start trading
              </p>
            </div>
          )}
        </CardContent>
      </Card>

    </div>
  );
}

