import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { useBalance } from "@/hooks/useBalance";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Send, ShieldCheck } from "lucide-react";

const Transfer = () => {
  const { balance } = useBalance();
  const { toast } = useToast();
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [sending, setSending] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const value = Number(amount);
    if (!value || value <= 0) {
      toast({ title: "Enter a valid amount", variant: "destructive" });
      return;
    }
    if (value > balance) {
      toast({ title: "Insufficient balance", description: "Deposit funds before transferring.", variant: "destructive" });
      return;
    }
    setSending(true);
    setTimeout(() => {
      toast({
        title: "Transfer request submitted",
        description: `$${value.toFixed(2)} to ${recipient} is pending admin review.`,
      });
      setRecipient("");
      setAmount("");
      setNote("");
      setSending(false);
    }, 800);
  };

  return (
    <DashboardLayout>
      <div className="max-w-xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-foreground">Transfer</h1>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Send className="h-4 w-4 text-primary" /> Send balance to another user
            </CardTitle>
            <CardDescription>
              Available balance: <strong>${balance.toFixed(2)}</strong>. Transfers are reviewed by an admin before release.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={submit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="recipient">Recipient email</Label>
                <Input
                  id="recipient"
                  type="email"
                  required
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  placeholder="user@example.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="amount">Amount (USD)</Label>
                <Input
                  id="amount"
                  type="number"
                  min="1"
                  step="0.01"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="50.00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="note">Note (optional)</Label>
                <Textarea id="note" value={note} onChange={(e) => setNote(e.target.value)} rows={3} />
              </div>
              <Button type="submit" className="w-full" disabled={sending}>
                {sending ? "Submitting..." : "Submit transfer request"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="flex items-start gap-2 text-xs text-muted-foreground">
          <ShieldCheck className="h-4 w-4 text-primary shrink-0" />
          <p>For your protection, transfers are manually verified. You will get a notification once processed.</p>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Transfer;
