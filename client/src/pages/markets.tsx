import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, TrendingUp, TrendingDown, Star, Eye } from "lucide-react";

interface Token {
  id: string;
  symbol: string;
  name: string;
  image: string | null;
  currentPrice: string | null;
  priceChange24h: string | null;
  volume24h: string | null;
  marketCap: string | null;
  isPinned: boolean;
}

interface Position {
  id: string;
  tokenId: string;
  side: string;
  status: string;
}

export default function Markets() {
  const [search, setSearch] = useState("");

  const { data: tokens, isLoading } = useQuery<Token[]>({
    queryKey: ["/api/tokens"],
    refetchInterval: 30000, // Slower refresh for token list (prices update on individual pages)
    staleTime: 15000, // Cache for 15 seconds
  });

  const { data: positions } = useQuery<Position[]>({
    queryKey: ["/api/positions"],
    refetchInterval: 10000,
    staleTime: 5000,
  });

  // Get token IDs that have active positions
  const tokensWithPositions = new Set(
    positions?.filter(p => p.status === "open").map(p => p.tokenId) || []
  );

  const formatPrice = (price: string | null) => {
    if (!price) return "$0.00";
    const num = parseFloat(price);
    if (num < 0.01) return `$${num.toFixed(6)}`;
    if (num < 1) return `$${num.toFixed(4)}`;
    return `$${num.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatChange = (change: string | null) => {
    if (!change) return "0.00%";
    const num = parseFloat(change);
    return `${num >= 0 ? "+" : ""}${num.toFixed(2)}%`;
  };

  const formatVolume = (volume: string | null) => {
    if (!volume) return "$0";
    const num = parseFloat(volume);
    if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}b`;
    if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}m`;
    if (num >= 1e3) return `$${(num / 1e3).toFixed(2)}k`;
    return `$${num.toFixed(2)}`;
  };

  const filteredTokens = tokens?.filter(
    (token) =>
      token.symbol.toLowerCase().includes(search.toLowerCase()) ||
      token.name.toLowerCase().includes(search.toLowerCase())
  );

  const pinnedTokens = filteredTokens?.filter((t) => t.isPinned) || [];
  const otherTokens = filteredTokens?.filter((t) => !t.isPinned) || [];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-medium">markets</h1>
          <p className="text-sm text-muted-foreground">
            top 50 tokens by market cap
          </p>
        </div>
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="search tokens..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
            data-testid="input-search-tokens"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-24 mb-2" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                  <Skeleton className="h-6 w-20" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {pinnedTokens.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Star className="h-3 w-3" />
                featured pairs
              </div>
              <div className="grid gap-2">
                {pinnedTokens.map((token) => (
                  <TokenRow key={token.id} token={token} formatPrice={formatPrice} formatChange={formatChange} formatVolume={formatVolume} hasActivePosition={tokensWithPositions.has(token.id)} />
                ))}
              </div>
            </div>
          )}

          {otherTokens.length > 0 && (
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">all markets</div>
              <div className="grid gap-2">
                {otherTokens.map((token) => (
                  <TokenRow key={token.id} token={token} formatPrice={formatPrice} formatChange={formatChange} formatVolume={formatVolume} hasActivePosition={tokensWithPositions.has(token.id)} />
                ))}
              </div>
            </div>
          )}

          {filteredTokens?.length === 0 && (
            <div className="py-12 text-center text-muted-foreground">
              no tokens found matching "{search}"
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function TokenRow({
  token,
  formatPrice,
  formatChange,
  formatVolume,
  hasActivePosition,
}: {
  token: Token;
  formatPrice: (p: string | null) => string;
  formatChange: (c: string | null) => string;
  formatVolume: (v: string | null) => string;
  hasActivePosition: boolean;
}) {
  const change = parseFloat(token.priceChange24h || "0");
  const isPositive = change >= 0;

  return (
    <div className="space-y-1">
      <Link href={`/app/trade/${token.id}`}>
        <Card className="hover-elevate cursor-pointer">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted overflow-hidden">
                {token.image ? (
                  <img
                    src={token.image}
                    alt={token.symbol}
                    className="h-8 w-8 rounded-full"
                  />
                ) : (
                  <span className="text-xs font-medium uppercase">
                    {token.symbol.slice(0, 2)}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium uppercase">{token.symbol}</span>
                  {token.isPinned && (
                    <Star className="h-3 w-3 text-primary fill-primary" />
                  )}
                </div>
                <p className="text-xs text-muted-foreground truncate">
                  {token.name}
                </p>
              </div>
              <div className="text-right">
                <p className="font-medium font-mono">
                  {formatPrice(token.currentPrice)}
                </p>
                <div className="flex items-center justify-end gap-1">
                  {isPositive ? (
                    <TrendingUp className="h-3 w-3 text-positive" />
                  ) : (
                    <TrendingDown className="h-3 w-3 text-negative" />
                  )}
                  <span
                    className={`text-xs font-mono ${
                      isPositive ? "text-positive" : "text-negative"
                    }`}
                  >
                    {formatChange(token.priceChange24h)}
                  </span>
                </div>
              </div>
              <div className="hidden sm:block text-right w-24">
                <p className="text-xs text-muted-foreground">24h vol</p>
                <p className="text-sm font-mono">
                  {formatVolume(token.volume24h)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </Link>
      {hasActivePosition && (
        <Link href="/app/positions" data-testid={`link-active-position-${token.id}`}>
          <div className="ml-14 flex items-center gap-1.5 text-xs text-primary hover:underline cursor-pointer">
            <Eye className="h-3 w-3" />
            view active position
          </div>
        </Link>
      )}
    </div>
  );
}
