import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { Brand } from "@/components/brand";
import { useAuth } from "@/hooks/use-auth";
import { 
  LineChart, 
  TrendingUp, 
  Bot, 
  Shield, 
  Zap, 
  Target,
  UserCheck,
  Wallet,
  Settings2,
  BarChart3,
  ArrowRight
} from "lucide-react";
import { SiX, SiTelegram } from "react-icons/si";

export default function Landing() {
  const [navHidden, setNavHidden] = useState(false);
  const { login } = useAuth();

  useEffect(() => {
    let lastScrollY = window.scrollY;
    
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      if (currentScrollY > 100) {
        setNavHidden(true);
      } else {
        setNavHidden(false);
      }
      
      lastScrollY = currentScrollY;
    };
    
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* gradient blobs background */}
      <div className="hero-blobs" aria-hidden="true">
        <div className="blob blob-1" />
        <div className="blob blob-2" />
        <div className="blob blob-3" />
        <div className="blob blob-4" />
      </div>
      
      {/* vignette overlay */}
      <div className="vignette-overlay" aria-hidden="true" />
      
      {/* film grain overlay */}
      <div className="film-grain" aria-hidden="true" />
      
      {/* all content */}
      <div className="relative" style={{ zIndex: 10 }}>
        {/* navbar */}
        <header className={`fixed top-0 left-0 right-0 z-50 nav-glass transition-transform duration-300 ${navHidden ? "-translate-y-full" : "translate-y-0"}`}>
          <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
            <Brand size="md" />
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Button onClick={login} size="sm" className="btn-premium" data-testid="button-login">
                launch app
              </Button>
            </div>
          </div>
        </header>

        {/* hero */}
        <section className="pt-32 pb-20 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-medium tracking-tight leading-tight mb-6">
            trade perpetuals
            <br />
            <span className="text-primary">with full control</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-8">
            execute leveraged positions using real market data.
            track performance, set automation rules, and refine your edge.
          </p>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <Button onClick={login} size="lg" className="btn-premium" data-testid="button-hero-cta">
              launch app
            </Button>
            <Button asChild variant="outline" size="lg">
              <a href="#how-it-works">how it works</a>
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-4">
            works with live market feeds from major exchanges
          </p>
        </div>
      </section>

      {/* stats */}
      <section className="py-16 px-4 section-divider">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          {[
            { value: "50+", label: "trading pairs" },
            { value: "25x", label: "max leverage" },
            { value: "$10k", label: "starting capital" },
            { value: "real-time", label: "data feeds" },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-2xl sm:text-3xl font-medium text-primary mb-1">
                {stat.value}
              </div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* how it works */}
      <section id="how-it-works" className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-medium mb-3">
              how it works
            </h2>
            <p className="text-muted-foreground">
              get started in minutes
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {[
              {
                icon: UserCheck,
                title: "sign in",
                description: "create your account and access the platform",
              },
              {
                icon: Wallet,
                title: "get balance",
                description: "claim your internal balance to start trading",
              },
              {
                icon: TrendingUp,
                title: "choose market",
                description: "select a pair and set your leverage level",
              },
              {
                icon: Settings2,
                title: "set rules",
                description: "define automation rules for entries and exits",
              },
              {
                icon: BarChart3,
                title: "track results",
                description: "monitor positions, risk, and performance",
              },
            ].map((item, index) => (
              <div key={item.title} className="glass-card p-5 rounded-lg text-center relative">
                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary mx-auto mb-3">
                  <item.icon className="h-5 w-5" />
                </div>
                <h3 className="font-medium mb-1.5 text-sm">{item.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {item.description}
                </p>
                {index < 4 && (
                  <ArrowRight className="hidden lg:block absolute -right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/30" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* features */}
      <section id="features" className="py-20 px-4 section-divider">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-medium mb-3">
              everything you need
            </h2>
            <p className="text-muted-foreground">
              professional tools for serious execution
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              {
                icon: TrendingUp,
                title: "real market data",
                description: "live prices from coingecko and binance with candlestick charts and technical indicators",
              },
              {
                icon: Zap,
                title: "perpetual execution",
                description: "isolated margin, leverage up to 25x, liquidation tracking, take profit and stop loss orders",
              },
              {
                icon: Bot,
                title: "automation rules",
                description: "set up rule-based trading signals with ema, rsi, and volatility filters",
              },
              {
                icon: Target,
                title: "risk management",
                description: "set daily loss limits, max positions, and capital caps enforced by the system",
              },
              {
                icon: LineChart,
                title: "performance analytics",
                description: "equity curves, win rate, max drawdown, daily pnl tracking and trade history",
              },
              {
                icon: Shield,
                title: "controlled environment",
                description: "isolated execution with no external wallets required",
              },
            ].map((feature) => (
              <div key={feature.title} className="glass-card p-5 rounded-lg">
                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary mb-4">
                  <feature.icon className="h-5 w-5" />
                </div>
                <h3 className="font-medium mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* cta */}
      <section className="py-20 px-4">
        <div className="max-w-xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-medium mb-4">
            ready to start?
          </h2>
          <p className="text-muted-foreground mb-6">
            access your dashboard and begin executing.
          </p>
          <Button onClick={login} size="lg" className="btn-premium" data-testid="button-cta-bottom">
            launch app
          </Button>
        </div>
      </section>

        {/* footer */}
        <footer className="py-12 px-4 section-divider">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
            {/* brand */}
            <div className="col-span-2 md:col-span-1">
              <div className="mb-3">
                <span className="font-medium text-lg">zerotek</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                perpetual trading execution platform with real market data and automation.
              </p>
            </div>

            {/* product */}
            <div>
              <h4 className="font-medium text-sm mb-3">product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><button onClick={login} className="link-hover hover:text-foreground">dashboard</button></li>
                <li><button onClick={login} className="link-hover hover:text-foreground">markets</button></li>
                <li><button onClick={login} className="link-hover hover:text-foreground">agent</button></li>
                <li><button onClick={login} className="link-hover hover:text-foreground">history</button></li>
                <li><Link href="/docs" className="link-hover hover:text-foreground">docs</Link></li>
              </ul>
            </div>

            {/* resources */}
            <div>
              <h4 className="font-medium text-sm mb-3">resources</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#how-it-works" className="link-hover hover:text-foreground">getting started</a></li>
                <li><Link href="/docs" className="link-hover hover:text-foreground">funding</Link></li>
                <li><Link href="/docs" className="link-hover hover:text-foreground">automation rules</Link></li>
                <li><Link href="/docs" className="link-hover hover:text-foreground">risk controls</Link></li>
              </ul>
            </div>

            {/* legal */}
            <div>
              <h4 className="font-medium text-sm mb-3">legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/terms" className="link-hover hover:text-foreground">terms of service</Link></li>
                <li><Link href="/privacy" className="link-hover hover:text-foreground">privacy policy</Link></li>
                <li><Link href="/cookies" className="link-hover hover:text-foreground">cookie policy</Link></li>
              </ul>
            </div>
          </div>

          {/* bottom row */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8 text-sm text-muted-foreground">
            <div className="flex items-center gap-4">
              <span>© 2026 zerotek. all rights reserved.</span>
              <span className="hidden sm:inline text-xs">internal execution environment</span>
            </div>
            <div className="flex items-center gap-4">
              <a 
                href="https://x.com/zerotekdotfun" 
                target="_blank" 
                rel="noopener noreferrer"
                className="hover:text-foreground"
                aria-label="follow on x"
                data-testid="link-twitter"
              >
                <SiX className="h-4 w-4" />
              </a>
              <a 
                href="https://t.me/zerotekdotfun" 
                target="_blank" 
                rel="noopener noreferrer"
                className="hover:text-foreground"
                aria-label="join telegram"
                data-testid="link-telegram"
              >
                <SiTelegram className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>
        </footer>
      </div>
    </div>
  );
}
