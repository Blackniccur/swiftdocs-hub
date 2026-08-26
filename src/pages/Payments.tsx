import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useBalance } from "@/hooks/useBalance";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Wallet, ArrowDownLeft, ArrowUpRight, Send } from "lucide-react";
import { serviceLabels } from "@/lib/services";
import type { Tables } from "@/integrations/supabase/types";

const paymentMethods = [
  { value: "binance", label: "Binance (Crypto)" },
  { value: "mpesa", label: "M-Pesa" },
];

const Payments = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { balance, refresh: refreshBalance } = useBalance();
  const [applications, setApplications] = useState<Tables<"applications">[]>([]);
  const [payments, setPayments] = useState<Tables<"payments">[]>([]);
  const [transactions, setTransactions] = useState<Tables<"transactions">[]>([]);
  const [selectedApp, setSelectedApp] = useState("none");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [amount, setAmount] = useState("");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadAll = async () => {
    if (!user) return;
    const [appRes, payRes, txRes] = await Promise.all([
      supabase.from("applications").select("*").eq("user_id", user.id),
      supabase.from("payments").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
      supabase.from("transactions").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
    ]);
    setApplications(appRes.data || []);
    setPayments(payRes.data || []);
    setTransactions(txRes.data || []);
    setLoading(false);
  };

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !paymentMethod) return;
    const parsedAmount = Number(amount);
    if (!parsedAmount || parsedAmount <= 0) {
      toast({ title: "Enter a valid amount", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.from("payments").insert({
        application_id: selectedApp === "none" ? null : selectedApp,
        user_id: user.id,
        amount: parsedAmount,
        payment_method: paymentMethod,
        reference_number: referenceNumber || null,
      });
      if (error) throw error;

      toast({
        title: "Payment submitted",
        description: "An admin will review it and credit your balance once verified.",
      });

      await loadAll();
      setSelectedApp("none");
      setPaymentMethod("");
      setAmount("");
      setReferenceNumber("");
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-foreground">Payments & Balance</h1>

        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Account balance</p>
              <p className="text-3xl font-bold text-foreground">${balance.toFixed(2)}</p>
            </div>
            <Wallet className="h-9 w-9 text-primary" />
          </CardContent>
        </Card>

        <Card className="border-primary/20">
          <CardContent className="p-4 text-sm space-y-1">
            <p className="font-medium text-foreground">Payment Instructions</p>
            <p className="text-muted-foreground">
              <strong>Binance:</strong> send to wallet <code className="bg-muted px-1 rounded">0x1234...abcd</code>
            </p>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Send className="h-5 w-5 text-primary" />
              Submit Payment
            </CardTitle>
            <CardDescription>Approved payments are added to your account balance.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmitPayment} className="space-y-4">
              <div className="space-y-2">
                <Label>Order (optional)</Label>
                <Select value={selectedApp} onValueChange={setSelectedApp}>
                  <SelectTrigger>
                    <SelectValue placeholder="Account top-up" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Account top-up (no order)</SelectItem>
                    {applications.map((app) => (
                      <SelectItem key={app.id} value={app.id}>
                        {serviceLabels[app.service_type] || app.service_type} — #{app.id.slice(0, 8)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="amount">Amount (USD)</Label>
                <Input
                  id="amount"
                  type="number"
                  min="1"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="e.g. 160"
                />
              </div>
              <div className="space-y-2">
                <Label>Payment Method</Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select payment method" />
                  </SelectTrigger>
                  <SelectContent>
                    {paymentMethods.map((m) => (
                      <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="ref">Reference / Transaction ID</Label>
                <Input
                  id="ref"
                  value={referenceNumber}
                  onChange={(e) => setReferenceNumber(e.target.value)}
                  placeholder="e.g. TXN-123456 or M-Pesa code"
                />
              </div>
              <Button type="submit" disabled={submitting || !paymentMethod || !amount}>
                {submitting ? "Submitting..." : "Submit for Verification"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Submitted Proofs</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-6">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
              </div>
            ) : payments.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No payments submitted yet.</p>
            ) : (
              <div className="space-y-3">
                {payments.map((pay) => (
                  <div key={pay.id} className="flex items-center justify-between border rounded-md p-3">
                    <div>
                      <p className="text-sm font-medium text-foreground capitalize">
                        {pay.payment_method} — ${Number(pay.amount ?? 0).toFixed(2)}
                      </p>
                      <p className="text-xs text-muted-foreground">{new Date(pay.created_at).toLocaleString()}</p>
                      {pay.reference_number && (
                        <p className="text-xs text-muted-foreground">Ref: {pay.reference_number}</p>
                      )}
                    </div>
                    <Badge
                      variant={pay.status === "verified" ? "default" : pay.status === "rejected" ? "destructive" : "secondary"}
                    >
                      {pay.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Transaction History</CardTitle>
            <CardDescription>Every change to your account balance.</CardDescription>
          </CardHeader>
          <CardContent>
            {transactions.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No transactions yet.</p>
            ) : (
              <div className="space-y-3">
                {transactions.map((tx) => {
                  const credit = tx.type === "credit";
                  return (
                    <div key={tx.id} className="flex items-center justify-between border rounded-md p-3">
                      <div className="flex items-center gap-3">
                        {credit ? (
                          <ArrowDownLeft className="h-4 w-4 text-primary" />
                        ) : (
                          <ArrowUpRight className="h-4 w-4 text-destructive" />
                        )}
                        <div>
                          <p className="text-sm font-medium text-foreground">{tx.description}</p>
                          <p className="text-xs text-muted-foreground">{new Date(tx.created_at).toLocaleString()}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-sm font-semibold ${credit ? "text-primary" : "text-destructive"}`}>
                          {credit ? "+" : "−"}${Number(tx.amount).toFixed(2)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Bal: ${Number(tx.balance_after).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Payments;
