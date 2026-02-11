import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import {
  Layers,
  TrendingUp,
  TrendingDown,
  XCircle,
  Target,
  ShieldAlert,
  Plus,
  Minus,
  Loader2,
  DollarSign,
  Percent,
  RefreshCw,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Bot,
} from "lucide-react";
import { Link } from "wouter";

interface Position {
  id: string;
  tokenId: string;
  side: string;
  entryPrice: string;
  quantity: string;
  leverage: number;
  margin: string;
  liquidationPrice: string;
  takeProfit: string | null;
  stopLoss: string | null;
  limitClosePrice: string | null;
  unrealizedPnl: string;
  roe: string;
  currentPrice: string;
  tokenName: string;
  tokenSymbol: string;
  tokenImage: string | null;
  status: string;
  createdAt: string;
  isAgentTrade: boolean;
}

export default function Positions() {
  const { toast } = useToast();
  const [selectedPosition, setSelectedPosition] = useState<Position | null>(null);
  const [tpValue, setTpValue] = useState("");
  const [slValue, setSlValue] = useState("");
  const [limitCloseValue, setLimitCloseValue] = useState("");
  const [marginAmount, setMarginAmount] = useState("");

  const { data: positions, isLoading, refetch } = useQuery<Position[]>({
    queryKey: ["/api/positions"],
    refetchInterval: 3000, // Fast refresh for live PnL updates
    staleTime: 1000,
  });

  const closePosition = useMutation({
    mutationFn: (id: string) => apiRequest("POST", `/api/positions/${id}/close`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/positions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      toast({ title: "position closed successfully" });
    },
    onError: (error: any) => {
      toast({ title: "failed to close position", description: error.message, variant: "destructive" });
    },
  });

  const closeAllPositions = useMutation({
    mutationFn: () => apiRequest("POST", "/api/positions/close-all"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/positions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      toast({ title: "all positions closed" });
    },
    onError: (error: any) => {
      toast({ title: "failed to close positions", description: error.message, variant: "destructive" });
    },
  });

  const updatePosition = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: any }) =>
      apiRequest("PATCH", `/api/positions/${id}`, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/positions"] });
      toast({ title: "position updated" });
      setSelectedPosition(null);
    },
    onError: (error: any) => {
      toast({ title: "failed to update position", description: error.message, variant: "destructive" });
    },
  });

  const addMargin = useMutation({
    mutationFn: ({ id, amount }: { id: string; amount: number }) =>
      apiRequest("POST", `/api/positions/${id}/add-margin`, { amount }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/positions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      toast({ title: "margin added" });
      setMarginAmount("");
    },
    onError: (error: any) => {
      toast({ title: "failed to add margin", description: error.message, variant: "destructive" });
    },
  });

  const removeMargin = useMutation({
    mutationFn: ({ id, amount }: { id: string; amount: number }) =>
      apiRequest("POST", `/api/positions/${id}/remove-margin`, { amount }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/positions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      toast({ title: "margin removed" });
      setMarginAmount("");
    },
    onError: (error: any) => {
      toast({ title: "failed to remove margin", description: error.message, variant: "destructive" });
    },
  });

  const handleSaveTPSL = (position: Position) => {
    const updates: any = {};
    if (tpValue) updates.takeProfit = parseFloat(tpValue);
    if (slValue) updates.stopLoss = parseFloat(slValue);
    if (limitCloseValue) updates.limitClosePrice = parseFloat(limitCloseValue);
    
    if (Object.keys(updates).length === 0) {
      toast({ title: "no changes to save", variant: "destructive" });
      return;
    }

    updatePosition.mutate({ id: position.id, updates });
  };

  const openPositionDialog = (position: Position) => {
    setSelectedPosition(position);
    setTpValue(position.takeProfit || "");
    setSlValue(position.stopLoss || "");
    setLimitCloseValue(position.limitClosePrice || "");
  };

  const formatPrice = (price: string | number) => {
    const num = typeof price === "string" ? parseFloat(price) : price;
    if (num >= 1000) return num.toLocaleString("en-US", { maximumFractionDigits: 2 });
    if (num >= 1) return num.toFixed(2);
    return num.toFixed(6);
  };

  const formatPnl = (pnl: string) => {
    const num = parseFloat(pnl);
    const formatted = Math.abs(num).toFixed(2);
    return num >= 0 ? `+$${formatted}` : `-$${formatted}`;
  };

  const formatRoe = (roe: string) => {
    const num = parseFloat(roe);
    const formatted = Math.abs(num).toFixed(2);
    return num >= 0 ? `+${formatted}%` : `-${formatted}%`;
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="noise-overlay" />
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-48 w-full" />
          ))}
        </div>
      </div>
    );
  }

  const openPositions = positions?.filter((p) => p.status === "open") || [];
  const totalUnrealizedPnl = openPositions.reduce((acc, p) => acc + parseFloat(p.unrealizedPnl), 0);
  const totalMargin = openPositions.reduce((acc, p) => acc + parseFloat(p.margin), 0);

  return (
    <div className="p-6 space-y-6 relative">
      <div className="noise-overlay" />

      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <Layers className="h-6 w-6 text-primary" />
            active positions
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            manage your open positions with advanced controls
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => refetch()}
            data-testid="button-refresh-positions"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>

          {openPositions.length > 0 && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm" data-testid="button-close-all">
                  <XCircle className="h-4 w-4 mr-2" />
                  close all
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>close all positions?</AlertDialogTitle>
                  <AlertDialogDescription>
                    this will close all {openPositions.length} open positions at market price. 
                    this action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => closeAllPositions.mutate()}
                    className="bg-destructive text-destructive-foreground"
                  >
                    {closeAllPositions.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "close all"
                    )}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Layers className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">open positions</p>
                <p className="text-2xl font-bold">{openPositions.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <DollarSign className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">total margin</p>
                <p className="text-2xl font-bold">${totalMargin.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${totalUnrealizedPnl >= 0 ? "bg-green-500/10" : "bg-red-500/10"}`}>
                {totalUnrealizedPnl >= 0 ? (
                  <ArrowUpRight className="h-5 w-5 text-green-500" />
                ) : (
                  <ArrowDownRight className="h-5 w-5 text-red-500" />
                )}
              </div>
              <div>
                <p className="text-sm text-muted-foreground">unrealized pnl</p>
                <p className={`text-2xl font-bold ${totalUnrealizedPnl >= 0 ? "text-green-500" : "text-red-500"}`}>
                  {formatPnl(totalUnrealizedPnl.toString())}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {openPositions.length === 0 ? (
        <Card className="glass-card">
          <CardContent className="py-12 text-center">
            <Layers className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium mb-2">no open positions</h3>
            <p className="text-muted-foreground mb-4">
              you don't have any active positions. go to markets to open a trade.
            </p>
            <Button asChild data-testid="button-go-to-markets">
              <Link href="/app/markets">go to markets</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {openPositions.map((position) => {
            const pnl = parseFloat(position.unrealizedPnl);
            const roe = parseFloat(position.roe);
            const isProfitable = pnl >= 0;

            return (
              <Card key={position.id} className="glass-card overflow-hidden" data-testid={`position-card-${position.id}`}>
                <div className={`h-1 ${position.side === "long" ? "bg-green-500" : "bg-red-500"}`} />
                
                <CardContent className="pt-4">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      {position.tokenImage && (
                        <img
                          src={position.tokenImage}
                          alt={position.tokenSymbol}
                          className="h-10 w-10 rounded-full"
                        />
                      )}
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-lg">{position.tokenSymbol.toUpperCase()}</span>
                          <Badge
                            variant={position.side === "long" ? "default" : "destructive"}
                            className="text-xs"
                          >
                            {position.side} {position.leverage}x
                          </Badge>
                          {position.isAgentTrade && (
                            <Badge variant="outline" className="text-xs border-primary/50 text-primary">
                              <Bot className="h-3 w-3 mr-1" />
                              agent
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{position.tokenName}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">entry price</p>
                        <p className="font-medium">${formatPrice(position.entryPrice)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">mark price</p>
                        <p className="font-medium">${formatPrice(position.currentPrice)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">size</p>
                        <p className="font-medium">{parseFloat(position.quantity).toFixed(6)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">margin</p>
                        <p className="font-medium">${parseFloat(position.margin).toFixed(2)}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className={`text-right px-4 py-2 rounded-lg ${isProfitable ? "bg-green-500/10" : "bg-red-500/10"}`}>
                        <p className={`font-bold ${isProfitable ? "text-green-500" : "text-red-500"}`}>
                          {formatPnl(position.unrealizedPnl)}
                        </p>
                        <p className={`text-xs ${isProfitable ? "text-green-500/80" : "text-red-500/80"}`}>
                          {formatRoe(position.roe)} roe
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-border/50">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                      <div className="flex items-center gap-2">
                        <ShieldAlert className="h-4 w-4 text-red-500" />
                        <div>
                          <p className="text-muted-foreground text-xs">liq. price</p>
                          <p className="font-medium text-red-500">${formatPrice(position.liquidationPrice)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Target className="h-4 w-4 text-green-500" />
                        <div>
                          <p className="text-muted-foreground text-xs">take profit</p>
                          <p className="font-medium">
                            {position.takeProfit ? `$${formatPrice(position.takeProfit)}` : "—"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <ShieldAlert className="h-4 w-4 text-orange-500" />
                        <div>
                          <p className="text-muted-foreground text-xs">stop loss</p>
                          <p className="font-medium">
                            {position.stopLoss ? `$${formatPrice(position.stopLoss)}` : "—"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-muted-foreground text-xs">limit close</p>
                          <p className="font-medium">
                            {position.limitClosePrice ? `$${formatPrice(position.limitClosePrice)}` : "—"}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" size="sm" data-testid={`button-close-${position.id}`}>
                            <XCircle className="h-4 w-4 mr-1" />
                            close market
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>close position?</AlertDialogTitle>
                            <AlertDialogDescription>
                              close this {position.side} position on {position.tokenSymbol.toUpperCase()} at market price?
                              current pnl: {formatPnl(position.unrealizedPnl)}
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => closePosition.mutate(position.id)}
                              className="bg-destructive text-destructive-foreground"
                            >
                              {closePosition.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                "close position"
                              )}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>

                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openPositionDialog(position)}
                            data-testid={`button-tpsl-${position.id}`}
                          >
                            <Target className="h-4 w-4 mr-1" />
                            tp / sl
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>set tp / sl / limit close</DialogTitle>
                            <DialogDescription>
                              configure take profit, stop loss, and limit close prices for this position
                            </DialogDescription>
                          </DialogHeader>

                          <div className="space-y-4 py-4">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <p className="text-muted-foreground">current price</p>
                                <p className="font-medium">${formatPrice(position.currentPrice)}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">entry price</p>
                                <p className="font-medium">${formatPrice(position.entryPrice)}</p>
                              </div>
                            </div>

                            <div className="space-y-3">
                              <div>
                                <Label className="text-sm flex items-center gap-2">
                                  <Target className="h-4 w-4 text-green-500" />
                                  take profit
                                </Label>
                                <Input
                                  type="number"
                                  step="0.01"
                                  placeholder="enter tp price"
                                  value={tpValue}
                                  onChange={(e) => setTpValue(e.target.value)}
                                  data-testid="input-tp"
                                />
                              </div>

                              <div>
                                <Label className="text-sm flex items-center gap-2">
                                  <ShieldAlert className="h-4 w-4 text-orange-500" />
                                  stop loss
                                </Label>
                                <Input
                                  type="number"
                                  step="0.01"
                                  placeholder="enter sl price"
                                  value={slValue}
                                  onChange={(e) => setSlValue(e.target.value)}
                                  data-testid="input-sl"
                                />
                              </div>

                              <div>
                                <Label className="text-sm flex items-center gap-2">
                                  <Clock className="h-4 w-4 text-primary" />
                                  limit close price
                                </Label>
                                <Input
                                  type="number"
                                  step="0.01"
                                  placeholder="close at this price"
                                  value={limitCloseValue}
                                  onChange={(e) => setLimitCloseValue(e.target.value)}
                                  data-testid="input-limit-close"
                                />
                              </div>
                            </div>
                          </div>

                          <DialogFooter>
                            <DialogClose asChild>
                              <Button variant="outline">cancel</Button>
                            </DialogClose>
                            <Button
                              onClick={() => handleSaveTPSL(position)}
                              disabled={updatePosition.isPending}
                              data-testid="button-save-tpsl"
                            >
                              {updatePosition.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                              ) : null}
                              save
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>

                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" data-testid={`button-add-margin-${position.id}`}>
                            <Plus className="h-4 w-4 mr-1" />
                            add margin
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>add margin</DialogTitle>
                            <DialogDescription>
                              add more margin to reduce liquidation risk
                            </DialogDescription>
                          </DialogHeader>

                          <div className="space-y-4 py-4">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <p className="text-muted-foreground">current margin</p>
                                <p className="font-medium">${parseFloat(position.margin).toFixed(2)}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">liq. price</p>
                                <p className="font-medium text-red-500">${formatPrice(position.liquidationPrice)}</p>
                              </div>
                            </div>

                            <div>
                              <Label className="text-sm">amount to add (usdt)</Label>
                              <Input
                                type="number"
                                step="1"
                                min="1"
                                placeholder="enter amount"
                                value={marginAmount}
                                onChange={(e) => setMarginAmount(e.target.value)}
                                data-testid="input-add-margin-amount"
                              />
                            </div>
                          </div>

                          <DialogFooter>
                            <DialogClose asChild>
                              <Button variant="outline">cancel</Button>
                            </DialogClose>
                            <Button
                              onClick={() => {
                                if (marginAmount && parseFloat(marginAmount) > 0) {
                                  addMargin.mutate({ id: position.id, amount: parseFloat(marginAmount) });
                                }
                              }}
                              disabled={addMargin.isPending || !marginAmount}
                              data-testid="button-confirm-add-margin"
                            >
                              {addMargin.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                              ) : null}
                              add margin
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>

                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" data-testid={`button-remove-margin-${position.id}`}>
                            <Minus className="h-4 w-4 mr-1" />
                            remove margin
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>remove margin</DialogTitle>
                            <DialogDescription>
                              withdraw margin from this position (increases liquidation risk)
                            </DialogDescription>
                          </DialogHeader>

                          <div className="space-y-4 py-4">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <p className="text-muted-foreground">current margin</p>
                                <p className="font-medium">${parseFloat(position.margin).toFixed(2)}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">liq. price</p>
                                <p className="font-medium text-red-500">${formatPrice(position.liquidationPrice)}</p>
                              </div>
                            </div>

                            <div>
                              <Label className="text-sm">amount to remove (usdt)</Label>
                              <Input
                                type="number"
                                step="1"
                                min="1"
                                placeholder="enter amount"
                                value={marginAmount}
                                onChange={(e) => setMarginAmount(e.target.value)}
                                data-testid="input-remove-margin-amount"
                              />
                            </div>
                          </div>

                          <DialogFooter>
                            <DialogClose asChild>
                              <Button variant="outline">cancel</Button>
                            </DialogClose>
                            <Button
                              variant="destructive"
                              onClick={() => {
                                if (marginAmount && parseFloat(marginAmount) > 0) {
                                  removeMargin.mutate({ id: position.id, amount: parseFloat(marginAmount) });
                                }
                              }}
                              disabled={removeMargin.isPending || !marginAmount}
                              data-testid="button-confirm-remove-margin"
                            >
                              {removeMargin.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                              ) : null}
                              remove margin
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>

                      <Button
                        variant="ghost"
                        size="sm"
                        asChild
                        data-testid={`button-view-chart-${position.id}`}
                      >
                        <Link href={`/app/trade/${position.tokenId}`}>
                          <TrendingUp className="h-4 w-4 mr-1" />
                          view chart
                        </Link>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
