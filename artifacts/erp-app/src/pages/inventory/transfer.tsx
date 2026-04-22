import { useState } from "react";
import { useListMaterials, useListLocations, useTransferStock, useListInventoryBalances } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowRightLeft, Loader2 } from "lucide-react";

export default function TransferPage() {
  const { data: materials } = useListMaterials();
  const { data: locations } = useListLocations();
  const { data: balances } = useListInventoryBalances();
  
  const transferMutation = useTransferStock();
  const { toast } = useToast();

  const [materialId, setMaterialId] = useState<string>("");
  const [fromLocationId, setFromLocationId] = useState<string>("");
  const [toLocationId, setToLocationId] = useState<string>("");
  const [quantity, setQuantity] = useState("1");
  const [reference, setReference] = useState("");

  const selectedMaterial = materials?.find(m => m.id.toString() === materialId);
  const availableBalance = balances?.find(b => 
    b.materialId.toString() === materialId && b.locationId.toString() === fromLocationId
  )?.quantity || 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (fromLocationId === toLocationId) {
      toast({ variant: "destructive", title: "Invalid Transfer", description: "Source and destination cannot be the same." });
      return;
    }

    try {
      await transferMutation.mutateAsync({
        data: {
          materialId: parseInt(materialId),
          fromLocationId: parseInt(fromLocationId),
          toLocationId: parseInt(toLocationId),
          quantity: parseFloat(quantity),
          reference: reference || null
        }
      });
      
      toast({ title: "Transfer Successful", description: "Stock has been moved." });
      setQuantity("1");
      setReference("");
      setFromLocationId("");
      setToLocationId("");
      
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.response?.data?.error || "Transfer failed." });
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center gap-4 border-b border-border pb-4">
        <div className="p-3 bg-blue-500/20 text-blue-500 rounded-xl">
          <ArrowRightLeft className="h-8 w-8" />
        </div>
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Internal Transfer</h1>
          <p className="text-muted-foreground mt-1">Move stock between warehouses.</p>
        </div>
      </div>

      <CardForm>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label>Material to Transfer</Label>
            <Select value={materialId} onValueChange={setMaterialId} required>
              <SelectTrigger className="h-12 bg-background">
                <SelectValue placeholder="Select material..." />
              </SelectTrigger>
              <SelectContent>
                {materials?.map(m => (
                  <SelectItem key={m.id} value={m.id.toString()}>
                    {m.materialCode} - {m.materialName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative">
            <div className="space-y-2">
              <Label>From Location</Label>
              <Select value={fromLocationId} onValueChange={setFromLocationId} required>
                <SelectTrigger className="h-12 bg-background border-destructive/30">
                  <SelectValue placeholder="Source..." />
                </SelectTrigger>
                <SelectContent>
                  {locations?.map(l => (
                    <SelectItem key={l.id} value={l.id.toString()}>{l.locationName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {materialId && fromLocationId && (
                <p className="text-xs text-muted-foreground mt-1">
                  Available: <span className="font-bold text-primary">{availableBalance}</span> {selectedMaterial?.unit}
                </p>
              )}
            </div>

            <div className="hidden md:flex absolute left-1/2 top-[30px] -translate-x-1/2 items-center justify-center h-8 w-8 rounded-full bg-card border border-border z-10">
              <ArrowRightLeft className="h-4 w-4 text-muted-foreground" />
            </div>

            <div className="space-y-2">
              <Label>To Location</Label>
              <Select value={toLocationId} onValueChange={setToLocationId} required>
                <SelectTrigger className="h-12 bg-background border-emerald-500/30">
                  <SelectValue placeholder="Destination..." />
                </SelectTrigger>
                <SelectContent>
                  {locations?.map(l => (
                    <SelectItem key={l.id} value={l.id.toString()}>{l.locationName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>Quantity</Label>
              <div className="relative">
                <Input 
                  type="number" 
                  min="0.001" 
                  max={availableBalance}
                  step="0.001"
                  required 
                  value={quantity}
                  onChange={e => setQuantity(e.target.value)}
                  className="h-12 bg-background pr-16 font-mono text-lg"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">
                  {selectedMaterial?.unit || "unit"}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Reference</Label>
              <Input 
                value={reference}
                onChange={e => setReference(e.target.value)}
                className="h-12 bg-background"
                placeholder="TRX-1029..."
              />
            </div>
          </div>

          <div className="pt-6 border-t border-border flex justify-end">
            <Button 
              type="submit" 
              size="lg" 
              className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-900/30 text-white"
              disabled={transferMutation.isPending || !materialId || !fromLocationId || !toLocationId}
            >
              {transferMutation.isPending ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <ArrowRightLeft className="mr-2 h-5 w-5" />}
              Execute Transfer
            </Button>
          </div>
        </form>
      </CardForm>
    </div>
  );
}

function CardForm({ children }: { children: React.ReactNode }) {
  return <div className="premium-card p-6 md:p-8">{children}</div>;
}
