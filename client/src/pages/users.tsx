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

  const handleStatusUpdate = async (id: number, status: "true" | "false" | "denied") => {
    try {
      await updateMutation.mutateAsync({ 
        id, 
        updates: { isApproved: status } 
      });
      
      let title = "User Approved";
      if (status === "false") title = "Approval Revoked";
      if (status === "denied") title = "Application Denied";

      toast({
        title,
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
    <div className="max-w-[1600px] mx-auto px-4 sm:px-10 lg:px-20 py-10">
      <div className="space-y-8">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-3 mb-1">
          <div className="p-2.5 bg-gradient-to-br from-primary/20 to-primary/5 rounded-xl border border-primary/10">
            <Shield className="w-5 h-5 text-primary" />
          </div>
          <h2 className="text-3xl font-black text-foreground" style={{ fontFamily: "'Playfair Display', serif" }}>User Management</h2>
        </div>
        <p className="text-muted-foreground font-medium text-sm ml-14">
          Institutional directory and access control
        </p>
      </div>

      {/* Pending Approvals Section */}
      {pendingUsers.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-yellow-500/15 to-yellow-500/5 rounded-full border border-yellow-200">
              <AlertCircle className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <h3 className="text-lg font-black" style={{ fontFamily: "'Playfair Display', serif" }}>Pending Approvals</h3>
              <p className="text-xs text-muted-foreground">{pendingUsers.length} user{pendingUsers.length !== 1 ? 's' : ''} awaiting review</p>
            </div>
          </div>
          <div className="bg-white rounded-2xl border shadow-sm overflow-hidden ring-2 ring-yellow-500/10">
            <Table>
              <TableHeader>
                <TableRow className="bg-yellow-500/[0.04] hover:bg-yellow-500/[0.04] border-b border-yellow-500/10">
                  <TableHead className="font-bold text-foreground/70 text-[11px] uppercase tracking-wider pl-5">User Identification</TableHead>
                  <TableHead className="font-bold text-foreground/70 text-[11px] uppercase tracking-wider">Account Status</TableHead>
                  <TableHead className="text-right font-bold text-foreground/70 text-[11px] uppercase tracking-wider pr-5">Administrative Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingUsers.map(u => (
                  <TableRow key={u.id} className="hover:bg-yellow-50/30 transition-colors border-b last:border-0">
                    <TableCell className="pl-5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-yellow-500/10 flex items-center justify-center text-yellow-700 border border-yellow-200">
                          <UserIcon className="w-4 h-4" />
                        </div>
                        <div className="flex flex-col gap-0.5">
                          <span className="font-bold text-foreground text-sm">{u.name}</span>
                          <span className="text-[11px] font-mono text-muted-foreground">{u.email}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-yellow-100 text-yellow-700 border-yellow-200 uppercase text-[10px] font-black tracking-widest px-2 py-0.5">
                        Requested
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right pr-5">
                      <div className="flex justify-end gap-2">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="h-8 rounded-lg text-red-600 border-red-200 hover:bg-red-50 font-bold text-xs gap-1.5"
                          onClick={() => handleStatusUpdate(u.id, "denied")}
                        >
                          <X className="w-3.5 h-3.5" /> Deny
                        </Button>
                        <Button 
                          size="sm" 
                          className="h-8 rounded-lg bg-green-600 hover:bg-green-700 text-white font-bold text-xs gap-1.5 px-4 shadow-sm"
                          onClick={() => handleStatusUpdate(u.id, "true")}
                        >
                          <Check className="w-3.5 h-3.5" /> Approve
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
          <div className="p-2 bg-gradient-to-br from-primary/15 to-primary/5 rounded-full border border-primary/10">
            <UserCheck className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-black" style={{ fontFamily: "'Playfair Display', serif" }}>Staff Directory</h3>
            <p className="text-xs text-muted-foreground">{approvedUsers.length} approved user{approvedUsers.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-[#0d3318]/[0.03] hover:bg-[#0d3318]/[0.03] border-b">
                <TableHead className="font-bold text-foreground/70 text-[11px] uppercase tracking-wider pl-5">Identity</TableHead>
                <TableHead className="font-bold text-foreground/70 text-[11px] uppercase tracking-wider">Institutional Role</TableHead>
                <TableHead className="text-right font-bold text-foreground/70 text-[11px] uppercase tracking-wider pr-5">Management</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                <TableCell colSpan={3} className="text-center py-20">
                  <div className="flex flex-col items-center">
                    <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin mb-4" />
                    <p className="text-sm text-muted-foreground font-medium">Verifying Directory...</p>
                  </div>
                </TableCell>
              </TableRow>
              ) : approvedUsers.length === 0 ? (
                <TableRow>
                <TableCell colSpan={3} className="text-center py-24">
                  <div className="flex flex-col items-center">
                    <div className="w-16 h-16 rounded-full bg-muted/40 flex items-center justify-center mb-4">
                      <UserIcon className="w-8 h-8 text-muted-foreground/30" />
                    </div>
                    <p className="font-bold text-muted-foreground text-lg">No approved staff found</p>
                    <p className="text-sm text-muted-foreground/60 mt-1">Approve pending users to populate the directory.</p>
                  </div>
                </TableCell>
              </TableRow>
              ) : (
                approvedUsers.map((u, index) => (
                  <TableRow key={u.id} className={`hover:bg-primary/[0.02] transition-all border-b last:border-0 ${index % 2 === 0 ? 'bg-white' : 'bg-muted/[0.04]'}`}>
                    <TableCell className="pl-5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-primary/5 flex items-center justify-center text-primary border border-primary/10">
                          <UserIcon className="w-4 h-4" />
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold tracking-tight text-sm">{u.name}</span>
                          <span className="text-[11px] font-mono text-muted-foreground/70">{u.email}</span>
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
                    <TableCell className="text-right pr-5">
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="text-xs font-semibold text-muted-foreground hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        onClick={() => handleStatusUpdate(u.id, "false")}
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
    </div>
  );
}
