import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useBalance } from "@/hooks/useBalance";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowDownLeft, ArrowUpRight, Wallet, Send, Plus } from "lucide-react";

const Balance = () => {
  const { user } = useAuth();
  const { balance } = useBalance();
  const [transactions, setTransactions] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("transactions")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(25)
      .then(({ data }) => setTransactions(data || []));
  }, [user]);

  const credited = transactions.filter((t) => Number(t.amount) > 0).reduce((s, t) => s + Number(t.amount), 0);
  const spent = transactions.filter((t) => Number(t.amount) < 0).reduce((s, t) => s + Math.abs(Number(t.amount)), 0);

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-foreground">Balance</h1>

        <Card className="bg-primary/5 border-primary/30">
          <CardContent className="p-6 flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <Wallet className="h-4 w-4 text-primary" /> Available balance
              </p>
              <p className="text-4xl font-bold text-foreground mt-1">${balance.toFixed(2)}</p>
            </div>
            <div className="flex gap-2">
              <Link to="/dashboard/deposit">
                <Button>
                  <Plus className="h-4 w-4 mr-2" /> Deposit
                </Button>
              </Link>
              <Link to="/dashboard/transfer">
                <Button variant="outline">
                  <Send className="h-4 w-4 mr-2" /> Transfer
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <div className="grid sm:grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Total credited</p>
              <p className="text-xl font-semibold text-foreground">${credited.toFixed(2)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Total spent</p>
              <p className="text-xl font-semibold text-foreground">${spent.toFixed(2)}</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {transactions.length === 0 && <p className="text-sm text-muted-foreground">No transactions yet.</p>}
            {transactions.map((t) => {
              const positive = Number(t.amount) > 0;
              return (
                <div key={t.id} className="flex items-center gap-3 border rounded-md p-3">
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center ${positive ? "bg-primary/10" : "bg-muted"}`}>
                    {positive ? (
                      <ArrowDownLeft className="h-4 w-4 text-primary" />
                    ) : (
                      <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground truncate">{t.description || t.type}</p>
                    <p className="text-xs text-muted-foreground">{new Date(t.created_at).toLocaleString()}</p>
                  </div>
                  <span className={`text-sm font-semibold ${positive ? "text-primary" : "text-foreground"}`}>
                    {positive ? "+" : "-"}${Math.abs(Number(t.amount)).toFixed(2)}
                  </span>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Balance;
