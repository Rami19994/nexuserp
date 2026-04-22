import { useState } from "react";
import { useListMaterials, useCreateMaterial, useUpdateMaterial, useDeleteMaterial, getListMaterialsQueryKey } from "@workspace/api-client-react";
import type { Material } from "@workspace/api-client-react/src/generated/api.schemas";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Plus, Edit2, Trash2, Search, Loader2 } from "lucide-react";

export default function MaterialsPage() {
  const { data: materials, isLoading } = useListMaterials();
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
  
  const [formData, setFormData] = useState({ materialCode: "", materialName: "", unit: "pcs" });

  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const createMutation = useCreateMaterial();
  const updateMutation = useUpdateMaterial();
  const deleteMutation = useDeleteMaterial();

  const filteredMaterials = materials?.filter(m => 
    m.materialCode.toLowerCase().includes(searchTerm.toLowerCase()) || 
    m.materialName.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const handleOpenDialog = (material?: Material) => {
    if (material) {
      setEditingMaterial(material);
      setFormData({ 
        materialCode: material.materialCode, 
        materialName: material.materialName, 
        unit: material.unit || "pcs" 
      });
    } else {
      setEditingMaterial(null);
      setFormData({ materialCode: "", materialName: "", unit: "pcs" });
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingMaterial) {
        await updateMutation.mutateAsync({ 
          id: editingMaterial.id, 
          data: { materialName: formData.materialName, unit: formData.unit } 
        });
        toast({ title: "Success", description: "Material updated." });
      } else {
        await createMutation.mutateAsync({ 
          data: { materialCode: formData.materialCode, materialName: formData.materialName, unit: formData.unit } 
        });
        toast({ title: "Success", description: "Material created." });
      }
      queryClient.invalidateQueries({ queryKey: getListMaterialsQueryKey() });
      setIsDialogOpen(false);
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.response?.data?.error || "Failed to save material." });
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this material?")) return;
    try {
      await deleteMutation.mutateAsync({ id });
      queryClient.invalidateQueries({ queryKey: getListMaterialsQueryKey() });
      toast({ title: "Deleted", description: "Material deleted successfully." });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.response?.data?.error || "Failed to delete material." });
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Materials Master</h1>
          <p className="text-muted-foreground mt-1">Manage raw materials and components.</p>
        </div>
        <Button onClick={() => handleOpenDialog()} className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20">
          <Plus className="mr-2 h-4 w-4" /> Add Material
        </Button>
      </div>

      <div className="premium-card p-4">
        <div className="relative mb-4 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search materials..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-background"
          />
        </div>

        <div className="rounded-xl border border-border/50 overflow-hidden bg-background/50">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-32 text-center">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
                  </TableCell>
                </TableRow>
              ) : filteredMaterials.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-32 text-center text-muted-foreground">
                    No materials found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredMaterials.map((material) => (
                  <TableRow key={material.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell className="font-medium text-primary">{material.materialCode}</TableCell>
                    <TableCell>{material.materialName}</TableCell>
                    <TableCell>
                      <span className="px-2 py-1 rounded-md bg-secondary text-xs font-medium text-secondary-foreground">
                        {material.unit}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(material)}>
                        <Edit2 className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(material.id)}>
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
            <DialogTitle className="text-xl">{editingMaterial ? "Edit Material" : "Add Material"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Material Code</Label>
              <Input 
                value={formData.materialCode} 
                onChange={e => setFormData({...formData, materialCode: e.target.value})} 
                disabled={!!editingMaterial}
                required
                placeholder="e.g. RAW-001"
              />
            </div>
            <div className="space-y-2">
              <Label>Material Name</Label>
              <Input 
                value={formData.materialName} 
                onChange={e => setFormData({...formData, materialName: e.target.value})} 
                required
                placeholder="e.g. Steel Sheet 5mm"
              />
            </div>
            <div className="space-y-2">
              <Label>Unit of Measure</Label>
              <Input 
                value={formData.unit} 
                onChange={e => setFormData({...formData, unit: e.target.value})} 
                required
                placeholder="e.g. pcs, kg, m"
              />
            </div>
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
