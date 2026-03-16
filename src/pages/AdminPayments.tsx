import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Navigate } from "react-router-dom";
import type { Tables } from "@/integrations/supabase/types";

const AdminPayments = () => {
  const { isAdmin, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [payments, setPayments] = useState<(Tables<"payments"> & { profile_name?: string })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAdmin) return;
    fetchPayments();
  }, [isAdmin]);

  const fetchPayments = async () => {
    const { data: rawPayments } = await supabase
      .from("payments")
      .select("*")
      .order("created_at", { ascending: false });

    if (rawPayments) {
      const userIds = [...new Set(rawPayments.map((p) => p.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name")
        .in("user_id", userIds);
      const profileMap = new Map(profiles?.map((p) => [p.user_id, p.full_name]) || []);
      setPayments(rawPayments.map((p) => ({ ...p, profile_name: profileMap.get(p.user_id) || "—" })));
    }
    setLoading(false);
  };

  const handleVerify = async (id: string, status: "verified" | "rejected") => {
    const { error } = await supabase.from("payments").update({ status }).eq("id", id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: `Payment ${status}` });
      fetchPayments();
    }
  };

  if (authLoading) return null;
  if (!isAdmin) return <Navigate to="/dashboard" replace />;

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-foreground">Admin — All Payments</h1>

        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Client</TableHead>
                    <TableHead>App ID</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Ref #</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.map((pay) => (
                    <TableRow key={pay.id}>
                      <TableCell>{pay.profile_name}</TableCell>
                      <TableCell className="font-mono text-xs">{pay.application_id.slice(0, 8)}</TableCell>
                      <TableCell className="capitalize">{pay.payment_method}</TableCell>
                      <TableCell>{pay.reference_number || "—"}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            pay.status === "verified" ? "default" : pay.status === "rejected" ? "destructive" : "secondary"
                          }
                        >
                          {pay.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">{new Date(pay.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>
                        {pay.status === "pending" && (
                          <div className="flex gap-1">
                            <Button size="sm" variant="outline" onClick={() => handleVerify(pay.id, "verified")}>
                              Verify
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => handleVerify(pay.id, "rejected")}>
                              Reject
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {payments.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        No payments found.
                      </TableCell>
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

export default AdminPayments;
