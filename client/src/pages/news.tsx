import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Newspaper, ExternalLink, TrendingUp, TrendingDown, Minus, Info } from "lucide-react";

interface NewsItem {
  id: string;
  title: string;
  url: string;
  source: string;
  publishedAt: string;
  sentiment?: 'positive' | 'negative' | 'neutral';
}

interface NewsResponse {
  items: NewsItem[];
  isLive: boolean;
}

const formatTimeAgo = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return "just now";
};

export default function News() {
  const { data: newsData, isLoading, isRefetching } = useQuery<NewsResponse>({
    queryKey: ["/api/news"],
    refetchInterval: 30000, // Refresh every 30 seconds for live updates
    staleTime: 15000, // Consider data stale after 15 seconds
  });

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Newspaper className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-medium">live news</h1>
            <p className="text-sm text-muted-foreground">
              real-time crypto news and market updates
            </p>
          </div>
        </div>
        {(newsData?.isLive || isRefetching) && (
          <div className="flex items-center gap-2">
            <div className={`h-2 w-2 rounded-full ${isRefetching ? 'bg-yellow-500 animate-pulse' : 'bg-emerald-500'}`} />
            <span className="text-xs text-muted-foreground">
              {isRefetching ? 'updating...' : 'live'}
            </span>
          </div>
        )}
      </div>

      <Card className="glass-card overflow-hidden border-primary/20">
        <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-5">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-primary mt-0.5 shrink-0" />
            <div>
              <h3 className="font-medium text-sm mb-1">about live news</h3>
              <p className="text-sm text-muted-foreground">
                stay informed with real-time crypto news from top sources. news items are color-coded by sentiment - green for positive, red for negative, and gray for neutral. use this feed to make informed trading decisions and stay ahead of market movements.
              </p>
              <p className="text-xs text-muted-foreground/70 mt-2">
                testnet phase - news feed will be enhanced for mainnet with more sources and filters
              </p>
            </div>
          </div>
        </div>
      </Card>

      <div className="space-y-3">
        {isLoading ? (
          Array.from({ length: 8 }).map((_, i) => (
            <Card key={i} className="glass-card">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Skeleton className="h-4 w-4 rounded-full shrink-0 mt-1" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          newsData?.items?.map((news) => (
            <a
              key={news.id}
              href={news.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block"
              data-testid={`news-item-${news.id}`}
            >
              <Card className="glass-card hover:border-primary/30 transition-all cursor-pointer group">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className={`mt-1 h-3 w-3 rounded-full shrink-0 flex items-center justify-center ${
                      news.sentiment === "positive" ? "bg-emerald-500/20" :
                      news.sentiment === "negative" ? "bg-red-500/20" :
                      "bg-muted"
                    }`}>
                      {news.sentiment === "positive" ? (
                        <TrendingUp className="h-2 w-2 text-emerald-500" />
                      ) : news.sentiment === "negative" ? (
                        <TrendingDown className="h-2 w-2 text-red-500" />
                      ) : (
                        <Minus className="h-2 w-2 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm leading-relaxed group-hover:text-primary transition-colors">
                        {news.title.toLowerCase()}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                          {news.source.toLowerCase()}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {formatTimeAgo(news.publishedAt)}
                        </span>
                      </div>
                    </div>
                    <ExternalLink className="h-4 w-4 text-muted-foreground/40 group-hover:text-primary/60 transition-colors shrink-0" />
                  </div>
                </CardContent>
              </Card>
            </a>
          ))
        )}

        {!isLoading && (!newsData?.items || newsData.items.length === 0) && (
          <Card className="glass-card">
            <CardContent className="p-8 text-center">
              <Newspaper className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">no news available at the moment</p>
              <p className="text-xs text-muted-foreground/60 mt-1">check back soon for updates</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
