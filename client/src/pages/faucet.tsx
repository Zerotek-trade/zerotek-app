import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest, getQueryFn } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Link } from "wouter";
import {
  Wallet,
  RefreshCw,
  Clock,
  Info,
  Droplets,
  ArrowRight,
  CheckCircle2,
  Coins,
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface FaucetData {
  balance: number;
  canClaimFaucet: boolean;
  faucetCooldown: number | null;
  lastClaimAt: string | null;
}

export default function Faucet() {
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();

  const { data, isLoading } = useQuery<FaucetData | null>({
    queryKey: ["/api/faucet/status"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    enabled: isAuthenticated,
  });

  const claimFaucet = useMutation({
    mutationFn: () => apiRequest("POST", "/api/faucet/claim"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/faucet/status"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["/api/agent/events"] });
      toast({
        title: "balance claimed",
        description: "10,000 usdt has been added to your balance",
      });
    },
    onError: (error: any) => {
      toast({
        title: "claim failed",
        description: error.message || "please try again later",
        variant: "destructive",
      });
    },
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const formatCooldown = (ms: number) => {
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6 max-w-2xl mx-auto">
        <Skeleton className="h-8 w-48" />
        <Card className="glass-card">
          <CardContent className="py-8">
            <div className="space-y-4 text-center">
              <Skeleton className="h-16 w-16 rounded-full mx-auto" />
              <Skeleton className="h-6 w-48 mx-auto" />
              <Skeleton className="h-4 w-64 mx-auto" />
              <Skeleton className="h-10 w-40 mx-auto" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
          <Droplets className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-xl font-semibold">faucet</h1>
          <p className="text-sm text-muted-foreground">claim test balance to start trading</p>
        </div>
      </div>

      <Card className="glass-card border-primary/20">
        <CardContent className="py-8">
          <div className="text-center space-y-6">
            <div className="flex justify-center">
              <div className="relative">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Coins className="h-10 w-10" />
                </div>
                {data?.canClaimFaucet && (
                  <div className="absolute -top-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                )}
              </div>
            </div>

            <div>
              <h2 className="text-2xl font-semibold mb-2">10,000 usdt</h2>
              <p className="text-muted-foreground">
                claim test balance every 24 hours
              </p>
            </div>

            <div className="flex items-center justify-center gap-2 text-sm">
              <Wallet className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">current balance:</span>
              <span className="font-medium">{formatCurrency(data?.balance || 0)}</span>
            </div>

            {!data?.canClaimFaucet && data?.faucetCooldown && (
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground bg-muted/50 rounded-lg py-3 px-4">
                <Clock className="h-4 w-4" />
                <span>next claim available in {formatCooldown(data.faucetCooldown)}</span>
              </div>
            )}

            <Button
              onClick={() => claimFaucet.mutate()}
              disabled={isLoading || (data !== null && data !== undefined && !data.canClaimFaucet) || claimFaucet.isPending}
              className="btn-premium"
              size="lg"
              data-testid="button-claim-faucet"
            >
              {claimFaucet.isPending && (
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
              )}
              {data?.canClaimFaucet ? "claim balance" : "already claimed"}
            </Button>

            <div className="pt-4 border-t border-border/50">
              <div className="flex items-start gap-2 text-xs text-muted-foreground text-left bg-muted/30 rounded-lg p-3">
                <Info className="h-4 w-4 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium mb-1">about test balance</p>
                  <p>this is simulated balance for testnet trading. no real funds are involved. balance resets are possible during testing phases.</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-base">what's next?</CardTitle>
          <CardDescription>start trading with your test balance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Link href="/app/markets">
              <Button variant="outline" className="w-full justify-between" data-testid="link-markets">
                <span className="flex items-center gap-2">
                  <Wallet className="h-4 w-4" />
                  browse markets
                </span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/app/agent">
              <Button variant="outline" className="w-full justify-between" data-testid="link-agent">
                <span className="flex items-center gap-2">
                  <RefreshCw className="h-4 w-4" />
                  setup automation
                </span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
