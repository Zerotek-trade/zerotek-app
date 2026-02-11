import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Download, Search, Calendar } from "lucide-react";

interface Trade {
  id: string;
  tokenId: string;
  side: string;
  type: string;
  price: string;
  quantity: string;
  fee: string;
  realizedPnl: string | null;
  createdAt: string;
}

export default function History() {
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState("all");

  const { data: trades, isLoading } = useQuery<Trade[]>({
    queryKey: ["/api/trades"],
  });

  const filteredTrades = trades?.filter((trade) => {
    const matchesSearch = trade.tokenId.toLowerCase().includes(search.toLowerCase());
    
    if (dateFilter === "all") return matchesSearch;
    
    const tradeDate = new Date(trade.createdAt);
    const now = new Date();
    
    if (dateFilter === "today") {
      return matchesSearch && tradeDate.toDateString() === now.toDateString();
    }
    if (dateFilter === "week") {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return matchesSearch && tradeDate >= weekAgo;
    }
    if (dateFilter === "month") {
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      return matchesSearch && tradeDate >= monthAgo;
    }
    
    return matchesSearch;
  });

  const exportCsv = () => {
    if (!filteredTrades) return;
    
    const headers = ["date", "token", "side", "type", "price", "quantity", "fee", "pnl"];
    const rows = filteredTrades.map((t) => [
      new Date(t.createdAt).toISOString(),
      t.tokenId,
      t.side,
      t.type,
      t.price,
      t.quantity,
      t.fee,
      t.realizedPnl || "",
    ]);
    
    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `zerotek-trades-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const totalPnl = filteredTrades?.reduce((sum, t) => sum + parseFloat(t.realizedPnl || "0"), 0) || 0;
  const totalFees = filteredTrades?.reduce((sum, t) => sum + parseFloat(t.fee || "0"), 0) || 0;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-medium">trade history</h1>
          <p className="text-sm text-muted-foreground">
            view and export your trading activity
          </p>
        </div>
        <Button variant="outline" onClick={exportCsv} disabled={!filteredTrades?.length} data-testid="button-export-csv">
          <Download className="h-4 w-4 mr-2" />
          export csv
        </Button>
      </div>

      {/* filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="search by token..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
            data-testid="input-search-trades"
          />
        </div>
        <Select value={dateFilter} onValueChange={setDateFilter}>
          <SelectTrigger className="w-[150px]" data-testid="select-date-filter">
            <Calendar className="h-4 w-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">all time</SelectItem>
            <SelectItem value="today">today</SelectItem>
            <SelectItem value="week">this week</SelectItem>
            <SelectItem value="month">this month</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">total trades</p>
            <p className="text-xl font-medium">{filteredTrades?.length || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">total pnl</p>
            <p className={`text-xl font-medium ${totalPnl >= 0 ? "text-positive" : "text-negative"}`}>
              {totalPnl >= 0 ? "+" : ""}${totalPnl.toFixed(2)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">total fees</p>
            <p className="text-xl font-medium">${totalFees.toFixed(2)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">net pnl</p>
            <p className={`text-xl font-medium ${totalPnl - totalFees >= 0 ? "text-positive" : "text-negative"}`}>
              {totalPnl - totalFees >= 0 ? "+" : ""}${(totalPnl - totalFees).toFixed(2)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : filteredTrades && filteredTrades.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>date</TableHead>
                    <TableHead>token</TableHead>
                    <TableHead>side</TableHead>
                    <TableHead>type</TableHead>
                    <TableHead className="text-right">price</TableHead>
                    <TableHead className="text-right">quantity</TableHead>
                    <TableHead className="text-right">fee</TableHead>
                    <TableHead className="text-right">pnl</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTrades.map((trade) => {
                    const pnl = trade.realizedPnl ? parseFloat(trade.realizedPnl) : null;
                    return (
                      <TableRow key={trade.id}>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(trade.createdAt).toLocaleDateString()}{" "}
                          {new Date(trade.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </TableCell>
                        <TableCell className="font-medium uppercase">
                          {trade.tokenId}
                        </TableCell>
                        <TableCell>
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
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {trade.type}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          ${parseFloat(trade.price).toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {parseFloat(trade.quantity).toFixed(4)}
                        </TableCell>
                        <TableCell className="text-right font-mono text-muted-foreground">
                          ${parseFloat(trade.fee).toFixed(2)}
                        </TableCell>
                        <TableCell className={`text-right font-mono ${pnl !== null ? (pnl >= 0 ? "text-positive" : "text-negative") : ""}`}>
                          {pnl !== null ? `${pnl >= 0 ? "+" : ""}$${pnl.toFixed(2)}` : "—"}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="py-12 text-center text-muted-foreground">
              {search ? `no trades found matching "${search}"` : "no trades yet. start trading to see your history here."}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
