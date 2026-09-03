import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { ShieldCheck, Wallet } from "lucide-react";

type UserRow = {
  user_id: string;
  full_name: string;
  phone: string | null;
  balance: number;
  created_at: string;
  isAdmin: boolean;
  orders: number;
};

const AdminUsers = () => {
  const { isAdmin, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<UserRow | null>(null);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchUsers = async () => {
    const [profilesRes, rolesRes, appsRes] = await Promise.all([
      supabase.from("profiles").select("user_id, full_name, phone, balance, created_at").order("created_at", { ascending: false }),
      supabase.from("user_roles").select("user_id, role"),
      supabase.from("applications").select("user_id"),
    ]);

    const admins = new Set((rolesRes.data || []).filter((r: any) => r.role === "admin").map((r: any) => r.user_id));
    const orderCounts = new Map<string, number>();
    (appsRes.data || []).forEach((a: any) => orderCounts.set(a.user_id, (orderCounts.get(a.user_id) || 0) + 1));

    setUsers(
      (profilesRes.data || []).map((p: any) => ({
        user_id: p.user_id,
        full_name: p.full_name || "Unnamed client",
        phone: p.phone,
        balance: Number(p.balance || 0),
        created_at: p.created_at,
        isAdmin: admins.has(p.user_id),
        orders: orderCounts.get(p.user_id) || 0,
      }))
    );
    setLoading(false);
  };

  useEffect(() => {
    if (!isAdmin) return;
    fetchUsers();
  }, [isAdmin]);

  const adjustBalance = async (type: "credit" | "debit") => {
    if (!selected) return;
    const value = Number(amount);
    if (!value || value <= 0) {
      toast({ title: "Enter a valid amount", variant: "destructive" });
      return;
    }
    setSaving(true);
    const { error } = await supabase.rpc("admin_credit_user", {
      _user_id: selected.user_id,
      _amount: value,
      _description: note,
      _type: type,
    });
    setSaving(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: type === "credit" ? "Balance credited" : "Balance debited" });
    setAmount("");
    setNote("");
    fetchUsers();
  };

  const toggleAdmin = async (row: UserRow) => {
    if (row.isAdmin) {
      const { error } = await supabase.from("user_roles").delete().eq("user_id", row.user_id).eq("role", "admin");
      if (error) return toast({ title: "Error", description: error.message, variant: "destructive" });
      toast({ title: "Admin access removed" });
    } else {
      const { error } = await supabase.from("user_roles").insert({ user_id: row.user_id, role: "admin" });
      if (error) return toast({ title: "Error", description: error.message, variant: "destructive" });
      toast({ title: "Admin access granted" });
    }
    fetchUsers();
  };

  if (authLoading) return null;
  if (!isAdmin) return <Navigate to="/dashboard" replace />;

  const filtered = users.filter((u) => {
    const q = query.trim().toLowerCase();
    return !q || u.full_name.toLowerCase().includes(q) || u.user_id.toLowerCase().includes(q);
  });

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-6xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Users</h1>
          <p className="text-sm text-muted-foreground">Review clients, adjust balances and manage admin access.</p>
        </div>

        <Input
          placeholder="Search by name or user ID..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="max-w-xs"
        />

        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Client</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Orders</TableHead>
                    <TableHead>Balance</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((row) => (
                    <TableRow key={row.user_id}>
                      <TableCell>
                        <p className="text-sm font-medium text-foreground">{row.full_name}</p>
                        <p className="font-mono text-xs text-muted-foreground">{row.user_id.slice(0, 8)}</p>
                      </TableCell>
                      <TableCell className="text-sm">{row.phone || "—"}</TableCell>
                      <TableCell className="text-sm">{row.orders}</TableCell>
                      <TableCell className="text-sm font-semibold">${row.balance.toFixed(2)}</TableCell>
                      <TableCell>
                        <Badge variant={row.isAdmin ? "default" : "secondary"}>{row.isAdmin ? "Admin" : "Client"}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button size="sm" variant="outline" onClick={() => setSelected(row)}>
                                <Wallet className="mr-1 h-4 w-4" /> Balance
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Adjust balance — {row.full_name}</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-3">
                                <p className="text-sm text-muted-foreground">Current balance: ${row.balance.toFixed(2)}</p>
                                <div className="space-y-1.5">
                                  <Label>Amount (USD)</Label>
                                  <Input type="number" min="0" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} />
                                </div>
                                <div className="space-y-1.5">
                                  <Label>Note (optional)</Label>
                                  <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Reason for adjustment" />
                                </div>
                                <div className="flex gap-2">
                                  <Button onClick={() => adjustBalance("credit")} disabled={saving}>Credit</Button>
                                  <Button variant="destructive" onClick={() => adjustBalance("debit")} disabled={saving}>Debit</Button>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                          <Button size="sm" variant={row.isAdmin ? "destructive" : "secondary"} onClick={() => toggleAdmin(row)}>
                            <ShieldCheck className="mr-1 h-4 w-4" />
                            {row.isAdmin ? "Revoke" : "Make admin"}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filtered.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">No users found.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default AdminUsers;
