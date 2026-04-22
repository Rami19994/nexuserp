import { useState } from "react";
import { useListLocations, useListInventoryBalances, useAdjustInventory, getListInventoryBalancesQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { ClipboardCheck, Loader2, Save } from "lucide-react";

export default function InventoryAuditPage() {
  const { data: locations } = useListLocations();
  const [locationId, setLocationId] = useState<string>("");
  
  const { data: balances, isLoading } = useListInventoryBalances(
    locationId ? { locationId: parseInt(locationId) } : undefined,
    { query: { enabled: !!locationId } as any }
  );

  const adjustMutation = useAdjustInventory();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Local state for counts
  const [counts, setCounts] = useState<Record<number, string>>({});
  const [adjustingId, setAdjustingId] = useState<number | null>(null);

  const handleSaveAdjust = async (materialId: number, currentQty: number) => {
    const countedStr = counts[materialId];
    if (!countedStr) return;
    
    const actualQty = parseFloat(countedStr);
    if (actualQty === currentQty) {
      toast({ description: "Count matches system quantity." });
      return;
    }

    setAdjustingId(materialId);
    try {
      await adjustMutation.mutateAsync({
        data: {
          materialId,
          locationId: parseInt(locationId),
          actualQty,
          userNote: "Stock audit adjustment"
        }
      });
      toast({ title: "Adjusted", description: `Inventory updated to ${actualQty}.` });
      queryClient.invalidateQueries({ queryKey: getListInventoryBalancesQueryKey() });
      // clear local state for this item
      setCounts(prev => { const n = {...prev}; delete n[materialId]; return n; });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: "Failed to adjust." });
    } finally {
      setAdjustingId(null);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Stock Count & Audit</h1>
          <p className="text-muted-foreground mt-1">Verify physical inventory against system records.</p>
        </div>
      </div>

      <div className="premium-card p-6">
        <div className="max-w-xs mb-6">
          <label className="block text-sm font-medium text-foreground mb-2">Select Location to Audit</label>
          <Select value={locationId} onValueChange={setLocationId}>
            <SelectTrigger className="bg-background">
              <SelectValue placeholder="Select location..." />
            </SelectTrigger>
            <SelectContent>
              {locations?.map(l => (
                <SelectItem key={l.id} value={l.id.toString()}>{l.locationName}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {locationId ? (
          <div className="rounded-xl border border-border/50 overflow-hidden bg-background/50">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead>Material Code</TableHead>
                  <TableHead>Material Name</TableHead>
                  <TableHead className="text-right">System Qty</TableHead>
                  <TableHead className="text-right w-48">Actual Count</TableHead>
                  <TableHead className="text-right w-32">Variance</TableHead>
                  <TableHead className="text-center w-24">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={6} className="h-32 text-center"><Loader2 className="animate-spin mx-auto text-primary" /></TableCell></TableRow>
                ) : balances?.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="h-32 text-center text-muted-foreground">No inventory found at this location.</TableCell></TableRow>
                ) : (
                  balances?.map((bal) => {
                    const countVal = counts[bal.materialId] !== undefined ? counts[bal.materialId] : "";
                    const hasCount = countVal !== "";
                    const variance = hasCount ? parseFloat(countVal) - bal.quantity : 0;
                    const isDiff = variance !== 0;

                    return (
                      <TableRow key={bal.id} className="hover:bg-muted/20">
                        <TableCell className="font-medium text-primary">{bal.material.materialCode}</TableCell>
                        <TableCell>{bal.material.materialName}</TableCell>
                        <TableCell className="text-right font-mono">{bal.quantity}</TableCell>
                        <TableCell className="text-right">
                          <Input 
                            type="number" 
                            className={`text-right font-mono h-9 ${hasCount && isDiff ? 'border-orange-500/50 focus:border-orange-500' : ''}`}
                            placeholder="Count..."
                            value={countVal}
                            onChange={(e) => setCounts({...counts, [bal.materialId]: e.target.value})}
                          />
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {hasCount ? (
                            <span className={variance > 0 ? "text-emerald-500" : variance < 0 ? "text-destructive" : "text-muted-foreground"}>
                              {variance > 0 ? "+" : ""}{variance.toFixed(2)}
                            </span>
                          ) : "-"}
                        </TableCell>
                        <TableCell className="text-center">
                          <Button 
                            size="sm" 
                            variant={hasCount && isDiff ? "default" : "ghost"}
                            className={hasCount && isDiff ? "bg-orange-500 hover:bg-orange-600 text-white" : ""}
                            disabled={!hasCount || adjustingId === bal.materialId}
                            onClick={() => handleSaveAdjust(bal.materialId, bal.quantity)}
                          >
                            {adjustingId === bal.materialId ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="h-48 border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center text-muted-foreground">
            <ClipboardCheck className="h-10 w-10 mb-2 opacity-50" />
            <p>Select a location to start counting</p>
          </div>
        )}
      </div>
    </div>
  );
}
