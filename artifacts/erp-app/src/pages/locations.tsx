import { useState } from "react";
import { useListLocations, useCreateLocation, useDeleteLocation, getListLocationsQueryKey } from "@workspace/api-client-react";
import type { Location } from "@workspace/api-client-react/src/generated/api.schemas";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, MapPin, Loader2 } from "lucide-react";

export default function LocationsPage() {
  const { data: locations, isLoading } = useListLocations();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [locationName, setLocationName] = useState("");
  
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const createMutation = useCreateLocation();
  const deleteMutation = useDeleteLocation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createMutation.mutateAsync({ data: { locationName } });
      toast({ title: "Success", description: "Location created." });
      queryClient.invalidateQueries({ queryKey: getListLocationsQueryKey() });
      setIsDialogOpen(false);
      setLocationName("");
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.response?.data?.error || "Failed to create location." });
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this location? It might contain inventory balances.")) return;
    try {
      await deleteMutation.mutateAsync({ id });
      queryClient.invalidateQueries({ queryKey: getListLocationsQueryKey() });
      toast({ title: "Deleted", description: "Location deleted successfully." });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.response?.data?.error || "Failed to delete location." });
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Warehouses & Locations</h1>
          <p className="text-muted-foreground mt-1">Manage physical storage locations.</p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)} className="bg-purple-600 hover:bg-purple-700 text-white shadow-lg shadow-purple-900/50">
          <Plus className="mr-2 h-4 w-4" /> Add Location
        </Button>
      </div>

      <div className="premium-card p-4 max-w-4xl">
        <div className="rounded-xl border border-border/50 overflow-hidden bg-background/50">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="w-16 text-center">ID</TableHead>
                <TableHead>Location Name</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={3} className="h-32 text-center">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
                  </TableCell>
                </TableRow>
              ) : locations?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="h-32 text-center text-muted-foreground">
                    No locations found.
                  </TableCell>
                </TableRow>
              ) : (
                locations?.map((loc) => (
                  <TableRow key={loc.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell className="text-center font-mono text-muted-foreground">{loc.id}</TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 text-purple-500 mr-2" />
                        <span className="font-medium">{loc.locationName}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(loc.id)}>
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
        <DialogContent className="sm:max-w-[400px] premium-card border-none">
          <DialogHeader>
            <DialogTitle className="text-xl">Add New Location</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Location Name</Label>
              <Input 
                value={locationName} 
                onChange={e => setLocationName(e.target.value)} 
                required
                placeholder="e.g. Main Warehouse Zone A"
              />
            </div>
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
