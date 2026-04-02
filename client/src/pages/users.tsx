import { useUsers, useUpdateUser } from "@/hooks/use-users";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check, X, Shield, User as UserIcon, UserCheck, AlertCircle } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

export default function UsersPage() {
  const { data: users, isLoading, error } = useUsers();
  const updateMutation = useUpdateUser();
  const { toast } = useToast();

  const handleStatusUpdate = async (id: number, approved: boolean) => {
    try {
      await updateMutation.mutateAsync({ 
        id, 
        updates: { isApproved: approved ? "true" : "false" } 
      });
      toast({
        title: approved ? "User Approved" : "Approval Revoked",
        description: `Successfully updated user status.`,
      });
    } catch (e: any) {
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: e.message,
      });
    }
  };

  const handleRoleUpdate = async (id: number, role: string) => {
    try {
      await updateMutation.mutateAsync({ id, updates: { role } });
      toast({
        title: "Role Updated",
        description: `User role changed to ${role}.`,
      });
    } catch (e: any) {
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: e.message,
      });
    }
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center space-y-4">
        <div className="p-4 bg-red-100 rounded-full">
          <AlertCircle className="w-12 h-12 text-red-600" />
        </div>
        <h3 className="text-xl font-bold">Failed to Load Users</h3>
        <p className="text-muted-foreground max-w-sm">There was an error communicating with the server. Please try refreshing the page.</p>
        <Button onClick={() => window.location.reload()}>Refresh Page</Button>
      </div>
    );
  }

  const pendingUsers = users?.filter(u => u.isApproved === "false") || [];
  const approvedUsers = users?.filter(u => u.isApproved === "true") || [];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-1">
        <h2 className="text-3xl font-display font-bold text-foreground tracking-tight">System User Management</h2>
        <p className="text-muted-foreground flex items-center gap-2 font-medium italic">
          <Shield className="w-4 h-4 text-primary" /> Institutional directory and access control.
        </p>
      </div>

      {/* Pending Approvals Section */}
      {pendingUsers.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-500/10 rounded-full">
              <AlertCircle className="w-5 h-5 text-yellow-600" />
            </div>
            <h3 className="text-xl font-bold">Pending Approvals ({pendingUsers.length})</h3>
          </div>
          <div className="bg-white rounded-2xl border shadow-xl overflow-hidden ring-4 ring-yellow-500/5">
            <Table>
              <TableHeader className="bg-yellow-500/5">
                <TableRow className="border-b border-yellow-500/10">
                  <TableHead className="font-bold text-yellow-900">User Identification</TableHead>
                  <TableHead className="font-bold text-yellow-900">Account Status</TableHead>
                  <TableHead className="text-right font-bold text-yellow-900">Administrative Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingUsers.map(u => (
                  <TableRow key={u.id} className="hover:bg-yellow-50/30 transition-colors">
                    <TableCell>
                      <div className="flex flex-col gap-0.5">
                        <span className="font-bold text-foreground text-md">{u.name}</span>
                        <span className="text-xs font-mono text-muted-foreground">{u.email}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-yellow-100 text-yellow-700 border-yellow-200 uppercase text-[10px] font-black tracking-widest px-2 py-0.5">
                        Requested
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 font-bold"
                          onClick={() => handleStatusUpdate(u.id, false)}
                        >
                          <X className="w-4 h-4 mr-1" /> Deny
                        </Button>
                        <Button 
                          size="sm" 
                          className="bg-green-600 hover:bg-green-700 text-white font-bold px-4 shadow-lg shadow-green-600/20"
                          onClick={() => handleStatusUpdate(u.id, true)}
                        >
                          <Check className="w-4 h-4 mr-1" /> Approve Access
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </section>
      )}

      {/* Main Users Directory */}
      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-full">
            <UserCheck className="w-5 h-5 text-primary" />
          </div>
          <h3 className="text-xl font-bold">Approved Staff Directory</h3>
        </div>
        <div className="bg-white rounded-2xl border shadow-xl overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow className="border-b">
                <TableHead className="font-bold text-primary">Identity</TableHead>
                <TableHead className="font-bold text-primary">Institutional Role</TableHead>
                <TableHead className="text-right font-bold text-primary">Management</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={3} className="text-center py-20 text-muted-foreground flex flex-col items-center gap-2"><div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin" /> Verifying Directory...</TableCell></TableRow>
              ) : approvedUsers.length === 0 ? (
                <TableRow><TableCell colSpan={3} className="text-center py-20 italic text-muted-foreground">No approved staff found in this unit.</TableCell></TableRow>
              ) : (
                approvedUsers.map((u) => (
                  <TableRow key={u.id} className="hover:bg-muted/20 transition-all border-b last:border-0">
                    <TableCell>
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-primary/5 flex items-center justify-center text-primary border border-primary/10">
                          <UserIcon className="w-5 h-5" />
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold tracking-tight text-md">{u.name}</span>
                          <span className="text-xs font-mono text-muted-foreground opacity-75">{u.email}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Select 
                        disabled={updateMutation.isPending} 
                        defaultValue={u.role} 
                        onValueChange={(val) => handleRoleUpdate(u.id, val)}
                      >
                        <SelectTrigger className="w-[180px] h-9 border-muted/60 font-medium">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Admin">Admin</SelectItem>
                          <SelectItem value="Lab Assistant">Lab Assistant</SelectItem>
                          <SelectItem value="Lab Incharge">Lab Incharge</SelectItem>
                          <SelectItem value="Principal">Principal</SelectItem>
                          <SelectItem value="Store Keeper">Store Keeper</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="text-muted-foreground hover:text-red-600 transition-colors"
                        onClick={() => handleStatusUpdate(u.id, false)}
                      >
                        Revoke Access
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </section>
    </div>
  );
}
