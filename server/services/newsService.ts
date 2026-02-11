import Parser from 'rss-parser';

interface NewsItem {
  id: string;
  title: string;
  url: string;
  source: string;
  publishedAt: string;
  currencies?: string[];
  sentiment?: 'positive' | 'negative' | 'neutral';
}

interface NewsResponse {
  items: NewsItem[];
  isLive: boolean;
}

const parser = new Parser({
  timeout: 10000,
  headers: {
    'User-Agent': 'Mozilla/5.0 (compatible; ZerotekBot/1.0)',
  },
});

const RSS_FEEDS = [
  { url: 'https://www.coindesk.com/arc/outboundfeeds/rss/', source: 'coindesk' },
  { url: 'https://decrypt.co/feed', source: 'decrypt' },
  { url: 'https://cointelegraph.com/rss', source: 'cointelegraph' },
  { url: 'https://bitcoinmagazine.com/feed', source: 'bitcoin magazine' },
  { url: 'https://thedefiant.io/feed', source: 'the defiant' },
];

const CRYPTO_KEYWORDS: Record<string, string[]> = {
  BTC: ['bitcoin', 'btc', 'satoshi'],
  ETH: ['ethereum', 'eth', 'vitalik', 'ether'],
  SOL: ['solana', 'sol'],
  XRP: ['ripple', 'xrp'],
  BNB: ['binance', 'bnb'],
  DOGE: ['dogecoin', 'doge'],
  ADA: ['cardano', 'ada'],
  DOT: ['polkadot', 'dot'],
  AVAX: ['avalanche', 'avax'],
  LINK: ['chainlink', 'link'],
};

let newsCache: {
  data: NewsResponse;
  timestamp: number;
} | null = null;

const CACHE_DURATION = 60000; // 60 second cache

export async function fetchCryptoNews(): Promise<NewsResponse> {
  if (newsCache && Date.now() - newsCache.timestamp < CACHE_DURATION) {
    return newsCache.data;
  }

  let allNews: NewsItem[] = [];
  let isLive = false;

  const feedPromises = RSS_FEEDS.map(async (feed) => {
    try {
      const result = await parser.parseURL(feed.url);
      return result.items.slice(0, 10).map((item, index) => {
        const title = item.title?.toLowerCase() || '';
        const currencies = extractCurrencies(title);
        const sentiment = analyzeSentiment(title);

        return {
          id: `${feed.source}-${index}-${Date.now()}`,
          title: (item.title || 'untitled').toLowerCase(),
          url: item.link || '#',
          source: feed.source,
          publishedAt: item.isoDate || item.pubDate || new Date().toISOString(),
          currencies,
          sentiment,
        };
      });
    } catch (error) {
      console.warn(`[News] RSS feed failed for ${feed.source}:`, error);
      return [];
    }
  });

  try {
    const results = await Promise.allSettled(feedPromises);
    for (const result of results) {
      if (result.status === 'fulfilled' && result.value.length > 0) {
        allNews = allNews.concat(result.value);
        isLive = true;
      }
    }
  } catch (error) {
    console.warn('[News] Error fetching RSS feeds:', error);
  }

  if (allNews.length > 0) {
    allNews.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
    allNews = allNews.slice(0, 30);
  } else {
    allNews = getFallbackNews();
    isLive = false;
  }

  const result: NewsResponse = { items: allNews, isLive };

  newsCache = {
    data: result,
    timestamp: Date.now(),
  };

  return result;
}

function extractCurrencies(title: string): string[] {
  const currencies: string[] = [];
  for (const [symbol, keywords] of Object.entries(CRYPTO_KEYWORDS)) {
    if (keywords.some(keyword => title.includes(keyword))) {
      currencies.push(symbol);
    }
  }
  return currencies;
}

function analyzeSentiment(title: string): 'positive' | 'negative' | 'neutral' {
  const positiveWords = ['surge', 'rally', 'gain', 'rise', 'bull', 'soar', 'jump', 'high', 'growth', 'up', 'bullish', 'breakout', 'pump', 'moon', 'ath', 'record', 'milestone', 'boost', 'launch', 'adopt', 'partnership', 'approved', 'win'];
  const negativeWords = ['crash', 'drop', 'fall', 'bear', 'plunge', 'decline', 'down', 'low', 'loss', 'sell', 'bearish', 'dump', 'hack', 'scam', 'fraud', 'sec', 'lawsuit', 'ban', 'reject', 'fail', 'concern', 'risk', 'warning'];
  
  const positiveCount = positiveWords.filter(word => title.includes(word)).length;
  const negativeCount = negativeWords.filter(word => title.includes(word)).length;
  
  if (positiveCount > negativeCount) return 'positive';
  if (negativeCount > positiveCount) return 'negative';
  return 'neutral';
}

function getFallbackNews(): NewsItem[] {
  const now = new Date();
  return [
    {
      id: '1',
      title: 'bitcoin continues to show strength above key support levels',
      url: 'https://www.coindesk.com/markets/bitcoin',
      source: 'coindesk',
      publishedAt: new Date(now.getTime() - 1800000).toISOString(),
      currencies: ['BTC'],
      sentiment: 'positive',
    },
    {
      id: '2',
      title: 'ethereum network sees increased activity ahead of upgrade',
      url: 'https://www.theblock.co/category/ethereum',
      source: 'the block',
      publishedAt: new Date(now.getTime() - 3600000).toISOString(),
      currencies: ['ETH'],
      sentiment: 'neutral',
    },
    {
      id: '3',
      title: 'solana ecosystem expands with new defi protocols',
      url: 'https://decrypt.co/tag/solana',
      source: 'decrypt',
      publishedAt: new Date(now.getTime() - 5400000).toISOString(),
      currencies: ['SOL'],
      sentiment: 'positive',
    },
    {
      id: '4',
      title: 'major exchange reports record trading volumes',
      url: 'https://cointelegraph.com/tags/cryptocurrency-exchange',
      source: 'cointelegraph',
      publishedAt: new Date(now.getTime() - 7200000).toISOString(),
      currencies: [],
      sentiment: 'positive',
    },
    {
      id: '5',
      title: 'regulatory discussions continue in key markets',
      url: 'https://www.coindesk.com/policy',
      source: 'coindesk',
      publishedAt: new Date(now.getTime() - 9000000).toISOString(),
      currencies: [],
      sentiment: 'neutral',
    },
  ];
}
