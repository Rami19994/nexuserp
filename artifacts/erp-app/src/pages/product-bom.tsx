import { useState } from "react";
import { useParams, Link } from "wouter";
import { useGetProduct, useListMaterials, useAddBomItem, useDeleteBomItem, getGetProductQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, ArrowLeft, Loader2, Layers } from "lucide-react";

export default function ProductBomPage() {
  const params = useParams();
  const productId = parseInt(params.id || "0", 10);
  
  const { data: product, isLoading: productLoading } = useGetProduct(productId);
  const { data: materials } = useListMaterials();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({ materialId: "", qtyPerUnit: "1" });
  
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const addBomMutation = useAddBomItem();
  const deleteBomMutation = useDeleteBomItem();

  const handleAddBom = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addBomMutation.mutateAsync({ 
        id: productId, 
        data: { 
          materialId: parseInt(formData.materialId), 
          qtyPerUnit: parseFloat(formData.qtyPerUnit) 
        } 
      });
      toast({ title: "Success", description: "BOM item added." });
      queryClient.invalidateQueries({ queryKey: getGetProductQueryKey(productId) });
      setIsDialogOpen(false);
      setFormData({ materialId: "", qtyPerUnit: "1" });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.response?.data?.error || "Failed to add BOM item." });
    }
  };

  const handleDeleteBom = async (bomId: number) => {
    try {
      await deleteBomMutation.mutateAsync({ id: productId, bomId });
      queryClient.invalidateQueries({ queryKey: getGetProductQueryKey(productId) });
      toast({ title: "Removed", description: "BOM item removed." });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: "Failed to remove item." });
    }
  };

  if (productLoading) {
    return <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (!product) {
    return <div className="p-8 text-center text-destructive">Product not found.</div>;
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center gap-4">
        <Link href="/products" className="p-2 rounded-lg bg-card border border-border hover:bg-muted transition-colors">
          <ArrowLeft className="h-5 w-5 text-muted-foreground" />
        </Link>
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground flex items-center">
            <Layers className="mr-3 h-8 w-8 text-accent" />
            BOM: {product.productCode}
          </h1>
          <p className="text-muted-foreground mt-1">{product.productName || "Unnamed Product"}</p>
        </div>
      </div>

      <div className="premium-card p-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Bill of Materials</h2>
          <Button onClick={() => setIsDialogOpen(true)} variant="secondary" className="shadow-md">
            <Plus className="mr-2 h-4 w-4" /> Add Material
          </Button>
        </div>

        <div className="rounded-xl border border-border/50 overflow-hidden bg-background/50">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead>Material Code</TableHead>
                <TableHead>Material Name</TableHead>
                <TableHead className="text-right">Qty Per Unit</TableHead>
                <TableHead className="text-center">UoM</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {product.bomItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                    This product has no materials in its BOM.
                  </TableCell>
                </TableRow>
              ) : (
                product.bomItems.map((item) => (
                  <TableRow key={item.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell className="font-medium text-primary">{item.material?.materialCode}</TableCell>
                    <TableCell>{item.material?.materialName}</TableCell>
                    <TableCell className="text-right font-mono">{item.qtyPerUnit}</TableCell>
                    <TableCell className="text-center">
                      <span className="px-2 py-1 bg-secondary text-secondary-foreground text-xs rounded-md">
                        {item.material?.unit}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteBom(item.id)}>
                        <Trash2 className="h-4 w-4 text-destructive/80 hover:text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px] premium-card border-none">
          <DialogHeader>
            <DialogTitle className="text-xl">Add Material to BOM</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddBom} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Select Material</Label>
              <Select value={formData.materialId} onValueChange={v => setFormData({...formData, materialId: v})} required>
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="Select a material..." />
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
            <div className="space-y-2">
              <Label>Quantity per 1 Unit of Product</Label>
              <Input 
                type="number"
                step="0.0001"
                min="0.0001"
                value={formData.qtyPerUnit} 
                onChange={e => setFormData({...formData, qtyPerUnit: e.target.value})} 
                required
              />
            </div>
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={addBomMutation.isPending || !formData.materialId}>
                {addBomMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Add to BOM
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
