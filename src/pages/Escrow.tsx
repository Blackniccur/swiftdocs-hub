import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Lock, ShieldCheck } from "lucide-react";
import { serviceLabels } from "@/lib/services";

const escrowState = (status: string) => {
  if (status === "ready") return { label: "Released", variant: "default" as const };
  if (status === "rejected") return { label: "Refunded", variant: "destructive" as const };
  return { label: "Funds held", variant: "secondary" as const };
};

const Escrow = () => {
  const { user } = useAuth();
  const [apps, setApps] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("applications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => setApps(data || []));
  }, [user]);

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Escrow</h1>
          <p className="text-sm text-muted-foreground">
            Payments stay in escrow until your order is delivered and confirmed.
          </p>
        </div>

        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="p-4 flex items-start gap-3">
            <ShieldCheck className="h-5 w-5 text-primary mt-0.5" />
            <p className="text-sm text-muted-foreground">
              Funds are only released to the seller after an admin marks your order as ready. Rejected orders are refunded to
              your balance.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Escrow activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {apps.length === 0 && <p className="text-sm text-muted-foreground">No escrow orders yet.</p>}
            {apps.map((a) => {
              const state = escrowState(a.status);
              return (
                <div key={a.id} className="flex flex-wrap items-center gap-3 border rounded-md p-3">
                  <Lock className="h-4 w-4 text-primary" />
                  <div className="flex-1 min-w-[140px]">
                    <p className="text-sm font-medium text-foreground">
                      {serviceLabels[a.service_type] || a.service_type}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Opened {new Date(a.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge variant={state.variant}>{state.label}</Badge>
                  <Link to={`/dashboard/application/${a.id}`}>
                    <Button size="sm" variant="outline">
                      View
                    </Button>
                  </Link>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Escrow;
