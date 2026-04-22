import { useState } from "react";
import { useListUsers, useCreateUser, useUpdateUser, useDeleteUser, getListUsersQueryKey } from "@workspace/api-client-react";
import type { User } from "@workspace/api-client-react/src/generated/api.schemas";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Shield, Plus, Edit2, Trash2, Loader2, User as UserIcon } from "lucide-react";

export default function UsersPage() {
  const { data: users, isLoading } = useListUsers();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  
  const [formData, setFormData] = useState({ 
    username: "", fullName: "", password: "", role: "Viewer", isActive: true 
  });

  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const createMutation = useCreateUser();
  const updateMutation = useUpdateUser();
  const deleteMutation = useDeleteUser();

  const handleOpenDialog = (user?: User) => {
    if (user) {
      setEditingUser(user);
      setFormData({ 
        username: user.username, 
        fullName: user.fullName, 
        password: "", // empty for edit unless changed
        role: user.role,
        isActive: user.isActive
      });
    } else {
      setEditingUser(null);
      setFormData({ username: "", fullName: "", password: "", role: "Viewer", isActive: true });
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingUser) {
        await updateMutation.mutateAsync({ 
          id: editingUser.id, 
          data: { 
            fullName: formData.fullName, 
            role: formData.role, 
            isActive: formData.isActive,
            password: formData.password || null
          } 
        });
        toast({ title: "Success", description: "User updated." });
      } else {
        if (!formData.password) {
          toast({ variant: "destructive", title: "Validation Error", description: "Password required for new user." });
          return;
        }
        await createMutation.mutateAsync({ 
          data: formData as any 
        });
        toast({ title: "Success", description: "User created." });
      }
      queryClient.invalidateQueries({ queryKey: getListUsersQueryKey() });
      setIsDialogOpen(false);
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.response?.data?.error || "Operation failed." });
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this user?")) return;
    try {
      await deleteMutation.mutateAsync({ id });
      queryClient.invalidateQueries({ queryKey: getListUsersQueryKey() });
      toast({ title: "Deleted", description: "User deleted." });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.response?.data?.error || "Delete failed." });
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground flex items-center">
            <Shield className="mr-3 h-8 w-8 text-primary" />
            User Management
          </h1>
          <p className="text-muted-foreground mt-1">Manage system access and roles.</p>
        </div>
        <Button onClick={() => handleOpenDialog()} className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20">
          <Plus className="mr-2 h-4 w-4" /> Add User
        </Button>
      </div>

      <div className="premium-card p-4">
        <div className="rounded-xl border border-border/50 overflow-hidden bg-background/50">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={4} className="h-32 text-center"><Loader2 className="animate-spin mx-auto" /></TableCell></TableRow>
              ) : (
                users?.map((u) => (
                  <TableRow key={u.id} className="hover:bg-muted/30">
                    <TableCell>
                      <div className="flex items-center">
                        <div className="h-8 w-8 rounded-full bg-primary/20 text-primary flex items-center justify-center mr-3">
                          <UserIcon className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{u.fullName}</p>
                          <p className="text-xs text-muted-foreground">{u.username}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold
                        ${u.role === 'Admin' ? 'bg-destructive/20 text-destructive' : 
                          u.role === 'Manager' ? 'bg-primary/20 text-primary' : 
                          u.role === 'Storekeeper' ? 'bg-accent/20 text-accent' : 'bg-muted text-muted-foreground'}`
                      }>
                        {u.role}
                      </span>
                    </TableCell>
                    <TableCell>
                      {u.isActive ? (
                        <span className="text-emerald-500 text-sm font-medium flex items-center"><div className="w-2 h-2 rounded-full bg-emerald-500 mr-2" /> Active</span>
                      ) : (
                        <span className="text-muted-foreground text-sm flex items-center"><div className="w-2 h-2 rounded-full bg-muted-foreground mr-2" /> Inactive</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(u)}>
                        <Edit2 className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                      </Button>
                      {u.username !== 'admin' && ( // Prevent deleting main admin
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(u.id)}>
                          <Trash2 className="h-4 w-4 text-destructive/80 hover:text-destructive" />
                        </Button>
                      )}
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
            <DialogTitle className="text-xl">{editingUser ? "Edit User" : "Add New User"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Username</Label>
              <Input 
                value={formData.username} 
                onChange={e => setFormData({...formData, username: e.target.value})} 
                disabled={!!editingUser}
                required
                className="bg-background"
              />
            </div>
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input 
                value={formData.fullName} 
                onChange={e => setFormData({...formData, fullName: e.target.value})} 
                required
                className="bg-background"
              />
            </div>
            <div className="space-y-2">
              <Label>Password {editingUser && <span className="text-muted-foreground font-normal">(Leave blank to keep current)</span>}</Label>
              <Input 
                type="password"
                value={formData.password} 
                onChange={e => setFormData({...formData, password: e.target.value})} 
                required={!editingUser}
                className="bg-background"
              />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={formData.role} onValueChange={v => setFormData({...formData, role: v})}>
                <SelectTrigger className="bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Admin">Admin</SelectItem>
                  <SelectItem value="Manager">Manager</SelectItem>
                  <SelectItem value="Storekeeper">Storekeeper</SelectItem>
                  <SelectItem value="Viewer">Viewer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between pt-2">
              <Label>Account Active</Label>
              <Switch checked={formData.isActive} onCheckedChange={c => setFormData({...formData, isActive: c})} />
            </div>
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save User
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
