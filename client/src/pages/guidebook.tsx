import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  BookOpen,
  Wallet,
  TrendingUp,
  Bot,
  BarChart3,
  LineChart,
  Target,
  Zap,
  Clock,
  DollarSign,
  ChevronRight,
  Activity,
  PieChart,
  Settings2,
  Play,
  AlertTriangle,
  HelpCircle,
  Rocket,
  Newspaper,
} from "lucide-react";
import { Link } from "wouter";

export default function Guidebook() {
  return (
    <div className="p-6 space-y-6 max-w-5xl">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <BookOpen className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-medium">guidebook</h1>
          <p className="text-sm text-muted-foreground">
            everything you need to know about using zerotek
          </p>
        </div>
      </div>

      <Card className="glass-card overflow-hidden border-primary/20">
        <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6">
          <div className="flex items-start gap-4">
            <div className="h-12 w-12 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0">
              <Bot className="h-6 w-6 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-medium text-lg">automated perpetual trading</h3>
                <Badge className="bg-primary/20 text-primary border-0 text-xs">our main feature</Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                zerotek's automation agent trades perpetual contracts for you. set your rules, configure your risk parameters, and let the agent execute trades 24/7 based on market signals.
              </p>
              <Link href="/app/agent">
                <Badge variant="outline" className="cursor-pointer hover:bg-primary/10">
                  try automation agent <ChevronRight className="h-3 w-3 ml-1" />
                </Badge>
              </Link>
            </div>
          </div>
        </div>
      </Card>

      <Card className="glass-card overflow-hidden border-amber-500/20">
        <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent p-5">
          <div className="flex items-start gap-4">
            <div className="h-10 w-10 rounded-xl bg-amber-500/20 flex items-center justify-center flex-shrink-0">
              <Rocket className="h-5 w-5 text-amber-500" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-medium">testnet phase</h3>
                <Badge className="bg-amber-500/20 text-amber-600 dark:text-amber-400 border-0 text-xs">beta</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                you're using zerotek testnet. this is our beta version where we're testing features and gathering feedback before mainnet launch. all balances and trades are on testnet.
              </p>
            </div>
          </div>
        </div>
      </Card>

      <Card className="glass-card overflow-hidden">
        <div className="p-6">
          <h3 className="font-medium text-base mb-4">getting started</h3>
          <div className="grid gap-4">
            <div className="flex items-start gap-3">
              <div className="h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold flex-shrink-0">1</div>
              <div>
                <p className="font-medium text-sm">claim your testnet balance</p>
                <p className="text-xs text-muted-foreground">get 10,000 usdt from the faucet. claimable every 24 hours</p>
              </div>
              <Link href="/app/faucet" className="ml-auto">
                <Badge variant="outline" className="text-xs cursor-pointer hover:bg-primary/10">
                  go <ChevronRight className="h-3 w-3 ml-0.5" />
                </Badge>
              </Link>
            </div>
            <div className="flex items-start gap-3">
              <div className="h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold flex-shrink-0">2</div>
              <div>
                <p className="font-medium text-sm">configure your automation agent</p>
                <p className="text-xs text-muted-foreground">set allowed pairs, max capital, leverage, and trade frequency. then start the agent</p>
              </div>
              <Link href="/app/agent" className="ml-auto">
                <Badge variant="outline" className="text-xs cursor-pointer hover:bg-primary/10">
                  go <ChevronRight className="h-3 w-3 ml-0.5" />
                </Badge>
              </Link>
            </div>
            <div className="flex items-start gap-3">
              <div className="h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold flex-shrink-0">3</div>
              <div>
                <p className="font-medium text-sm">watch the agent trade</p>
                <p className="text-xs text-muted-foreground">agent scans markets, opens positions with tp/sl, and closes automatically</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold flex-shrink-0">4</div>
              <div>
                <p className="font-medium text-sm">track performance</p>
                <p className="text-xs text-muted-foreground">view agent stats. win rate, total profit, accuracy, and all trades</p>
              </div>
              <Link href="/app" className="ml-auto">
                <Badge variant="outline" className="text-xs cursor-pointer hover:bg-primary/10">
                  go <ChevronRight className="h-3 w-3 ml-0.5" />
                </Badge>
              </Link>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="glass-card group hover:border-primary/30 transition-colors md:col-span-2">
          <CardContent className="p-5">
            <div className="flex items-start gap-4">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Bot className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium mb-1 flex items-center gap-2">
                  automation agent
                  <Link href="/app/agent">
                    <Badge variant="outline" className="text-xs cursor-pointer hover:bg-primary/10">
                      go <ChevronRight className="h-3 w-3 ml-0.5" />
                    </Badge>
                  </Link>
                </h3>
                <p className="text-sm text-muted-foreground mb-3">
                  automated perpetual trading with configurable rules and risk management.
                </p>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2 text-xs">
                    <p className="font-medium text-sm mb-2">how it works</p>
                    <div className="flex items-center gap-2">
                      <Play className="h-3.5 w-3.5 text-primary" />
                      <span>start agent to begin automated trading</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Activity className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>scans markets for entry signals</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Target className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>auto sets tp (5%) and sl (3%)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>closes positions when targets hit</span>
                    </div>
                  </div>
                  <div className="space-y-2 text-xs">
                    <p className="font-medium text-sm mb-2">configuration</p>
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>set max capital per trade</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Zap className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>choose leverage (1 to 25x)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>set trade cooldown (1 to 60 min)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <BarChart3 className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>select allowed trading pairs</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card group hover:border-primary/30 transition-colors">
          <CardContent className="p-5">
            <div className="flex items-start gap-4">
              <div className="h-10 w-10 rounded-xl bg-muted/50 flex items-center justify-center flex-shrink-0">
                <Wallet className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium mb-1 flex items-center gap-2">
                  faucet
                  <Link href="/app/faucet">
                    <Badge variant="outline" className="text-xs cursor-pointer hover:bg-primary/10">
                      go <ChevronRight className="h-3 w-3 ml-0.5" />
                    </Badge>
                  </Link>
                </h3>
                <p className="text-sm text-muted-foreground mb-3">
                  get testnet usdt to start trading.
                </p>
                <div className="space-y-2 text-xs text-muted-foreground">
                  <p>10,000 usdt per claim</p>
                  <p>24 hour cooldown</p>
                  <p>no limit on total claims</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card group hover:border-primary/30 transition-colors">
          <CardContent className="p-5">
            <div className="flex items-start gap-4">
              <div className="h-10 w-10 rounded-xl bg-muted/50 flex items-center justify-center flex-shrink-0">
                <BarChart3 className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium mb-1 flex items-center gap-2">
                  markets
                  <Link href="/app/markets">
                    <Badge variant="outline" className="text-xs cursor-pointer hover:bg-primary/10">
                      go <ChevronRight className="h-3 w-3 ml-0.5" />
                    </Badge>
                  </Link>
                </h3>
                <p className="text-sm text-muted-foreground mb-3">
                  browse real time cryptocurrency prices.
                </p>
                <div className="space-y-2 text-xs text-muted-foreground">
                  <p>100+ cryptocurrencies</p>
                  <p>live prices from coingecko</p>
                  <p>24h change, volume, market cap</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card group hover:border-primary/30 transition-colors">
          <CardContent className="p-5">
            <div className="flex items-start gap-4">
              <div className="h-10 w-10 rounded-xl bg-muted/50 flex items-center justify-center flex-shrink-0">
                <TrendingUp className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium mb-1">manual trading</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  open perpetual positions on any token.
                </p>
                <div className="space-y-2 text-xs text-muted-foreground">
                  <p>1x to 25x leverage</p>
                  <p>set take profit and stop loss</p>
                  <p>tradingview advanced charts</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card group hover:border-primary/30 transition-colors">
          <CardContent className="p-5">
            <div className="flex items-start gap-4">
              <div className="h-10 w-10 rounded-xl bg-muted/50 flex items-center justify-center flex-shrink-0">
                <PieChart className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium mb-1 flex items-center gap-2">
                  positions
                  <Link href="/app/positions">
                    <Badge variant="outline" className="text-xs cursor-pointer hover:bg-primary/10">
                      go <ChevronRight className="h-3 w-3 ml-0.5" />
                    </Badge>
                  </Link>
                </h3>
                <p className="text-sm text-muted-foreground mb-3">
                  manage all your open positions.
                </p>
                <div className="space-y-2 text-xs text-muted-foreground">
                  <p>position aggregation</p>
                  <p>add or remove margin</p>
                  <p>modify tp and sl after opening</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card group hover:border-primary/30 transition-colors">
          <CardContent className="p-5">
            <div className="flex items-start gap-4">
              <div className="h-10 w-10 rounded-xl bg-muted/50 flex items-center justify-center flex-shrink-0">
                <Newspaper className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium mb-1 flex items-center gap-2">
                  live news
                  <Link href="/app/news">
                    <Badge variant="outline" className="text-xs cursor-pointer hover:bg-primary/10">
                      go <ChevronRight className="h-3 w-3 ml-0.5" />
                    </Badge>
                  </Link>
                </h3>
                <p className="text-sm text-muted-foreground mb-3">
                  real-time crypto news and market updates.
                </p>
                <div className="space-y-2 text-xs text-muted-foreground">
                  <p>sentiment indicators (bullish/bearish)</p>
                  <p>news from top crypto sources</p>
                  <p>click to read full articles</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <HelpCircle className="h-4 w-4" />
            trading concepts
          </CardTitle>
          <CardDescription>
            key terms for perpetual trading
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="p-4 rounded-lg bg-muted/30">
              <h4 className="font-medium text-sm mb-1">long position</h4>
              <p className="text-xs text-muted-foreground">
                profit when price goes up. use when you're bullish.
              </p>
            </div>
            <div className="p-4 rounded-lg bg-muted/30">
              <h4 className="font-medium text-sm mb-1">short position</h4>
              <p className="text-xs text-muted-foreground">
                profit when price goes down. use when you're bearish.
              </p>
            </div>
            <div className="p-4 rounded-lg bg-muted/30">
              <h4 className="font-medium text-sm mb-1">leverage</h4>
              <p className="text-xs text-muted-foreground">
                10x means $100 controls $1,000. higher leverage means higher risk.
              </p>
            </div>
            <div className="p-4 rounded-lg bg-muted/30">
              <h4 className="font-medium text-sm mb-1">margin</h4>
              <p className="text-xs text-muted-foreground">
                your collateral. you lose it all if liquidated.
              </p>
            </div>
            <div className="p-4 rounded-lg bg-muted/30">
              <h4 className="font-medium text-sm mb-1">take profit (tp)</h4>
              <p className="text-xs text-muted-foreground">
                auto close when price hits your profit target.
              </p>
            </div>
            <div className="p-4 rounded-lg bg-muted/30">
              <h4 className="font-medium text-sm mb-1">stop loss (sl)</h4>
              <p className="text-xs text-muted-foreground">
                auto close to limit losses.
              </p>
            </div>
            <div className="p-4 rounded-lg bg-muted/30">
              <h4 className="font-medium text-sm mb-1">liquidation</h4>
              <p className="text-xs text-muted-foreground">
                forced close when losses exceed margin.
              </p>
            </div>
            <div className="p-4 rounded-lg bg-muted/30">
              <h4 className="font-medium text-sm mb-1">pnl</h4>
              <p className="text-xs text-muted-foreground">
                unrealized while open, realized after close.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="glass-card border-muted">
        <CardContent className="p-5">
          <div className="flex items-start gap-4">
            <div className="h-10 w-10 rounded-xl bg-muted/50 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <h3 className="font-medium mb-2">important</h3>
              <div className="space-y-1 text-sm text-muted-foreground">
                <p>you're on zerotek testnet. mainnet coming soon</p>
                <p>real market data from coingecko and binance</p>
                <p>we never ask for private keys</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
