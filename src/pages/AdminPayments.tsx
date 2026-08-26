import { useEffect, useState } from "react";
import { Card, CardContent as _CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Navigate } from "react-router-dom";
import type { Tables } from "@/integrations/supabase/types";

type PaymentRow = Tables<"payments"> & { profile_name?: string; profile_balance?: number };

const AdminPayments = () => {
  const { isAdmin, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState<PaymentRow | null>(null);
  const [reviewAmount, setReviewAmount] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [creditUserId, setCreditUserId] = useState("");
  const [creditAmount, setCreditAmount] = useState("");
  const [creditDesc, setCreditDesc] = useState("");
  const [creditType, setCreditType] = useState<"credit" | "debit">("credit");
  const [crediting, setCrediting] = useState(false);

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
        .select("user_id, full_name, balance")
        .in("user_id", userIds);
      const profileMap = new Map(profiles?.map((p) => [p.user_id, p]) || []);
      setPayments(
        rawPayments.map((p) => ({
          ...p,
          profile_name: profileMap.get(p.user_id)?.full_name || "—",
          profile_balance: Number(profileMap.get(p.user_id)?.balance ?? 0),
        }))
      );
    }
    setLoading(false);
  };

  const openReview = (pay: PaymentRow) => {
    setActive(pay);
    setReviewAmount(pay.amount ? String(pay.amount) : "");
    setNote("");
  };

  const submitReview = async (approve: boolean) => {
    if (!active) return;
    if (approve && (!Number(reviewAmount) || Number(reviewAmount) <= 0)) {
      toast({ title: "Enter a valid amount to credit", variant: "destructive" });
      return;
    }
    setBusy(true);
    const { error } = await supabase.rpc("review_payment", {
      _payment_id: active.id,
      _approve: approve,
      _amount: approve ? Number(reviewAmount) : null,
      _note: note,
    });
    setBusy(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    toast({
      title: approve ? "Payment approved" : "Payment rejected",
      description: approve ? `Client balance credited with $${Number(reviewAmount).toFixed(2)}.` : "Client has been notified.",
    });
    setActive(null);
    fetchPayments();
  };

  const submitCredit = async () => {
    if (!creditUserId || !Number(creditAmount) || Number(creditAmount) <= 0) {
      toast({ title: "Select a client and enter a valid amount", variant: "destructive" });
      return;
    }
    setCrediting(true);
    const { error } = await supabase.rpc("admin_credit_user", {
      _user_id: creditUserId,
      _amount: Number(creditAmount),
      _description: creditDesc,
      _type: creditType,
    });
    setCrediting(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    toast({
      title: creditType === "credit" ? "Balance credited" : "Balance debited",
      description: `$${Number(creditAmount).toFixed(2)} applied to the client's balance.`,
    });
    setCreditAmount("");
    setCreditDesc("");
    fetchPayments();
  };

  if (authLoading) return null;
  if (!isAdmin) return <Navigate to="/dashboard" replace />;

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-foreground">Admin — Payment Verification</h1>

        {/* Credit client balance */}
        <Card>
          <CardContent className="p-4 space-y-4">
            <p className="font-medium text-foreground">Credit / Debit Client Balance</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Client</Label>
                <select
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                  value={creditUserId}
                  onChange={(e) => setCreditUserId(e.target.value)}
                >
                  <option value="">Select client</option>
                  {[...new Map(payments.map((p) => [p.user_id, p.profile_name])).entries()].map(([uid, name]) => (
                    <option key={uid} value={uid}>
                      {name} — {uid.slice(0, 8)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Type</Label>
                <select
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                  value={creditType}
                  onChange={(e) => setCreditType(e.target.value as "credit" | "debit")}
                >
                  <option value="credit">Credit (add)</option>
                  <option value="debit">Debit (subtract)</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>Amount (USD)</Label>
                <Input
                  type="number"
                  min="1"
                  step="0.01"
                  value={creditAmount}
                  onChange={(e) => setCreditAmount(e.target.value)}
                  placeholder="e.g. 160"
                />
              </div>
              <div className="space-y-2">
                <Label>Description (optional)</Label>
                <Input
                  value={creditDesc}
                  onChange={(e) => setCreditDesc(e.target.value)}
                  placeholder="Reason or reference"
                />
              </div>
            </div>
            <Button onClick={submitCredit} disabled={crediting || !creditUserId || !creditAmount}>
              {crediting ? "Applying..." : creditType === "credit" ? "Credit balance" : "Debit balance"}
            </Button>
          </CardContent>
        </Card>


        <Card>
          <CardContent className="p-0 overflow-x-auto">
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Client</TableHead>
                    <TableHead>Balance</TableHead>
                    <TableHead>Amount</TableHead>
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
                      <TableCell>${(pay.profile_balance ?? 0).toFixed(2)}</TableCell>
                      <TableCell>{pay.amount ? `$${Number(pay.amount).toFixed(2)}` : "—"}</TableCell>
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
                        <Button size="sm" variant="outline" onClick={() => openReview(pay)}>
                          {pay.status === "pending" ? "Review" : "View"}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {payments.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
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

      <Dialog open={!!active} onOpenChange={(open) => !open && setActive(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Review payment proof</DialogTitle>
            <DialogDescription>
              {active?.profile_name} — current balance ${(active?.profile_balance ?? 0).toFixed(2)}
            </DialogDescription>
          </DialogHeader>

          {proofUrl ? (
            <a href={proofUrl} target="_blank" rel="noreferrer" className="block">
              <img src={proofUrl} alt="Payment proof receipt" className="max-h-64 w-full object-contain rounded border" />
              <span className="text-xs text-primary underline">Open full receipt</span>
            </a>
          ) : (
            <p className="text-sm text-muted-foreground">No receipt preview available.</p>
          )}

          <div className="space-y-2">
            <Label htmlFor="credit">Amount to credit (USD)</Label>
            <Input
              id="credit"
              type="number"
              min="1"
              step="0.01"
              value={reviewAmount}
              onChange={(e) => setReviewAmount(e.target.value)}
              disabled={active?.status !== "pending"}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="note">Note to client (optional)</Label>
            <Input
              id="note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Reason or reference"
              disabled={active?.status !== "pending"}
            />
          </div>

          {active?.status === "pending" && (
            <div className="flex gap-2">
              <Button disabled={busy} onClick={() => submitReview(true)}>
                Approve & credit balance
              </Button>
              <Button variant="destructive" disabled={busy} onClick={() => submitReview(false)}>
                Reject
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default AdminPayments;
