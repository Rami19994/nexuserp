import { useState, useMemo } from "react";
import { useListTransactions, useListInventoryBalances } from "@workspace/api-client-react";
import { format } from "date-fns";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Download, Loader2, Search, X, Package } from "lucide-react";

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState("inventory");
  const [searchQuery, setSearchQuery] = useState("");

  const { data: balances, isLoading: loadingBalances } = useListInventoryBalances();
  const { data: transactions, isLoading: loadingTx } = useListTransactions({ limit: 500 } as any);

  // ── Filter logic ───────────────────────────────────────────────────────
  const q = searchQuery.trim().toLowerCase();

  const filteredBalances = useMemo(() => {
    if (!balances) return [];
    if (!q) return balances;
    return balances.filter(b =>
      b.material.materialCode.toLowerCase().includes(q) ||
      b.material.materialName.toLowerCase().includes(q) ||
      b.location.locationName.toLowerCase().includes(q)
    );
  }, [balances, q]);

  const filteredTransactions = useMemo(() => {
    if (!transactions) return [];
    if (!q) return transactions;
    return transactions.filter(t =>
      t.material.materialCode.toLowerCase().includes(q) ||
      (t.material.materialName || "").toLowerCase().includes(q) ||
      (t.fromLocation?.locationName || "").toLowerCase().includes(q) ||
      (t.toLocation?.locationName || "").toLowerCase().includes(q)
    );
  }, [transactions, q]);

  // ── Highlight helper ───────────────────────────────────────────────────
  const Hl = ({ text }: { text: string }) => {
    if (!q || !text) return <>{text}</>;
    const idx = text.toLowerCase().indexOf(q);
    if (idx === -1) return <>{text}</>;
    return (
      <>
        {text.slice(0, idx)}
        <mark className="bg-primary/30 text-primary rounded px-0.5">{text.slice(idx, idx + q.length)}</mark>
        {text.slice(idx + q.length)}
      </>
    );
  };

  // ── CSV export ─────────────────────────────────────────────────────────
  const exportToCsv = () => {
    if (activeTab === "inventory" && filteredBalances.length) {
      const headers = ["Location", "Material Code", "Material Name", "Quantity", "Unit"];
      const rows = filteredBalances.map(b => [
        b.location.locationName,
        b.material.materialCode,
        b.material.materialName,
        b.quantity.toString(),
        b.material.unit || "",
      ]);
      downloadCsv(headers, rows, "inventory_balance_report.csv");
    } else if (activeTab === "transactions" && filteredTransactions.length) {
      const headers = ["Date", "Type", "Material Code", "Material Name", "Qty", "From", "To", "Reference"];
      const rows = filteredTransactions.map(t => [
        format(new Date(t.txDatetime), "yyyy-MM-dd HH:mm"),
        t.txType,
        t.material.materialCode,
        t.material.materialName || "",
        t.quantity.toString(),
        t.fromLocation?.locationName || "-",
        t.toLocation?.locationName || "-",
        t.reference || "-",
      ]);
      downloadCsv(headers, rows, "transaction_history.csv");
    }
  };

  const downloadCsv = (headers: string[], rows: string[][], filename: string) => {
    const csvContent = [
      headers.join(","),
      ...rows.map(r => r.map(cell => `"${(cell || "").replace(/"/g, '""')}"`).join(","))
    ].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const activeCount = activeTab === "inventory" ? filteredBalances.length : filteredTransactions.length;
  const totalCount  = activeTab === "inventory" ? (balances?.length ?? 0) : (transactions?.length ?? 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Reports</h1>
          <p className="text-muted-foreground mt-1">Analytics, history, and data exports.</p>
        </div>
        <Button variant="outline" onClick={exportToCsv} className="bg-card hover:bg-muted gap-2">
          <Download className="h-4 w-4" />
          {q ? `Export ${activeCount} Results` : "Export CSV"}
        </Button>
      </div>

      <div className="premium-card p-2 sm:p-6">
        <Tabs value={activeTab} onValueChange={val => { setActiveTab(val); setSearchQuery(""); }} className="w-full">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
            <TabsList className="grid w-full max-w-sm grid-cols-2 bg-background border border-border shrink-0">
              <TabsTrigger value="inventory" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
                Current Inventory
              </TabsTrigger>
              <TabsTrigger value="transactions" className="data-[state=active]:bg-accent/20 data-[state=active]:text-accent">
                Transaction History
              </TabsTrigger>
            </TabsList>

            {/* Search bar */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search by material code, name, or location…"
                className="pl-9 pr-9 h-10 bg-background"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Result count badge */}
            {q && (
              <span className="text-xs text-muted-foreground whitespace-nowrap shrink-0">
                {activeCount} of {totalCount} rows
              </span>
            )}
          </div>

          {/* ── Inventory Tab ── */}
          <TabsContent value="inventory" className="m-0">
            <div className="rounded-xl border border-border/50 overflow-hidden bg-background/50">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead>Location</TableHead>
                    <TableHead>Material Code</TableHead>
                    <TableHead>Material Name</TableHead>
                    <TableHead className="text-right">Quantity</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadingBalances ? (
                    <TableRow>
                      <TableCell colSpan={4} className="h-32 text-center">
                        <Loader2 className="animate-spin mx-auto" />
                      </TableCell>
                    </TableRow>
                  ) : filteredBalances.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="h-40 text-center">
                        <div className="flex flex-col items-center gap-2 text-muted-foreground">
                          <Package className="h-10 w-10 opacity-20" />
                          <p className="text-sm">
                            {q ? `No results for "${searchQuery}"` : "No inventory data found."}
                          </p>
                          {q && (
                            <button onClick={() => setSearchQuery("")} className="text-xs text-primary hover:underline">
                              Clear search
                            </button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : filteredBalances.map(b => (
                    <TableRow key={b.id}>
                      <TableCell className="font-medium text-purple-400">
                        <Hl text={b.location.locationName} />
                      </TableCell>
                      <TableCell className="font-mono text-primary">
                        <Hl text={b.material.materialCode} />
                      </TableCell>
                      <TableCell>
                        <Hl text={b.material.materialName} />
                      </TableCell>
                      <TableCell className="text-right font-mono font-bold">
                        {b.quantity}
                        <span className="text-xs font-normal text-muted-foreground ml-1">{b.material.unit}</span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          {/* ── Transactions Tab ── */}
          <TabsContent value="transactions" className="m-0">
            <div className="rounded-xl border border-border/50 overflow-hidden bg-background/50">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead>Date &amp; Time</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Material</TableHead>
                    <TableHead className="text-right">Qty</TableHead>
                    <TableHead>From</TableHead>
                    <TableHead>To</TableHead>
                    <TableHead>Reference</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadingTx ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-32 text-center">
                        <Loader2 className="animate-spin mx-auto" />
                      </TableCell>
                    </TableRow>
                  ) : filteredTransactions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-40 text-center">
                        <div className="flex flex-col items-center gap-2 text-muted-foreground">
                          <Search className="h-10 w-10 opacity-20" />
                          <p className="text-sm">
                            {q ? `No transactions matching "${searchQuery}"` : "No transactions found."}
                          </p>
                          {q && (
                            <button onClick={() => setSearchQuery("")} className="text-xs text-primary hover:underline">
                              Clear search
                            </button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : filteredTransactions.map(t => (
                    <TableRow key={t.id}>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        {format(new Date(t.txDatetime), "MMM dd, yyyy HH:mm")}
                      </TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-md text-[10px] uppercase font-bold tracking-wider
                          ${t.txType === "IN"       ? "bg-emerald-500/20 text-emerald-400" :
                            t.txType === "OUT"      ? "bg-destructive/20 text-destructive" :
                            t.txType === "TRANSFER" ? "bg-blue-500/20 text-blue-400" :
                                                      "bg-muted text-muted-foreground"}`}
                        >
                          {t.txType}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="font-mono text-sm text-primary">
                          <Hl text={t.material.materialCode} />
                        </div>
                        {t.material.materialName && (
                          <div className="text-xs text-muted-foreground">
                            <Hl text={t.material.materialName} />
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-mono font-medium">{t.quantity}</TableCell>
                      <TableCell className="text-sm">
                        <Hl text={t.fromLocation?.locationName || "-"} />
                      </TableCell>
                      <TableCell className="text-sm">
                        <Hl text={t.toLocation?.locationName || "-"} />
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-[120px] truncate">
                        {t.reference || "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
