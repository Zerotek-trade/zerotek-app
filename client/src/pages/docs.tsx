import { Link } from "wouter";
import { ArrowLeft, BookOpen, Wallet, Bot, Shield, TrendingUp, BarChart3, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const sections = [
  {
    icon: BookOpen,
    title: "getting started",
    description: "learn the basics of using the platform",
    items: [
      "create your account and sign in",
      "navigate the dashboard interface",
      "understand the market overview",
    ],
  },
  {
    icon: Wallet,
    title: "funding",
    description: "manage your internal balance",
    items: [
      "claim your initial balance",
      "understand the cooldown period",
      "track your available funds",
    ],
  },
  {
    icon: TrendingUp,
    title: "trading",
    description: "execute perpetual positions",
    items: [
      "select a trading pair from markets",
      "set your position size and leverage",
      "place take profit and stop loss orders",
      "monitor open positions in real-time",
    ],
  },
  {
    icon: Bot,
    title: "automation rules",
    description: "set up rule-based trading",
    items: [
      "configure trading pairs for automation",
      "set ema crossover signals",
      "define rsi thresholds",
      "enable volatility filters",
      "set maximum daily loss limits",
    ],
  },
  {
    icon: Shield,
    title: "risk controls",
    description: "protect your balance",
    items: [
      "set maximum position size",
      "configure daily loss limits",
      "understand liquidation mechanics",
      "use isolated margin effectively",
    ],
  },
  {
    icon: BarChart3,
    title: "analytics",
    description: "track your performance",
    items: [
      "view your equity curve",
      "analyze win rate and pnl",
      "review trade history",
      "monitor maximum drawdown",
    ],
  },
];

export default function Docs() {
  return (
    <div className="min-h-screen bg-background">
      <div className="noise-overlay" />
      
      <div className="max-w-4xl mx-auto px-4 py-16">
        <Button asChild variant="ghost" size="sm" className="mb-8">
          <Link href="/">
            <ArrowLeft className="h-4 w-4 mr-2" />
            back to home
          </Link>
        </Button>

        <h1 className="text-3xl font-medium mb-2">documentation</h1>
        <p className="text-muted-foreground mb-6">
          everything you need to know about using zerotek
        </p>

        <Card className="mb-8 border-primary/30 bg-primary/5">
          <CardContent className="py-4 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm text-muted-foreground">for detailed documentation visit</p>
              <a 
                href="https://docs.zerotek.fun" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary font-medium hover:underline flex items-center gap-1.5"
                data-testid="link-full-docs"
              >
                docs.zerotek.fun
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
            <Button asChild variant="outline" size="sm">
              <a href="https://docs.zerotek.fun" target="_blank" rel="noopener noreferrer">
                view full docs
              </a>
            </Button>
          </CardContent>
        </Card>

        <p className="text-sm text-muted-foreground mb-4">quick summary</p>

        <div className="grid gap-6">
          {sections.map((section) => (
            <div key={section.title} className="glass-card p-6 rounded-lg">
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <section.icon className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="font-medium mb-1">{section.title}</h2>
                  <p className="text-sm text-muted-foreground mb-4">{section.description}</p>
                  <ul className="space-y-2">
                    {section.items.map((item, index) => (
                      <li key={index} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span className="h-1 w-1 rounded-full bg-primary shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <p className="text-sm text-muted-foreground mb-4">
            ready to start trading?
          </p>
          <Button asChild className="btn-premium">
            <a href="/api/login">launch app</a>
          </Button>
        </div>
      </div>
    </div>
  );
}
