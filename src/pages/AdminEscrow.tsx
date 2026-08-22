import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Lock, ShieldCheck, XCircle } from "lucide-react";
import { serviceLabels, statusLabels } from "@/lib/services";

const AdminEscrow = () => {
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const [apps, setApps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    supabase
      .from("applications")
      .select("*")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setApps(data || []);
        setLoading(false);
      });
  };

  useEffect(load, []);

  const update = async (id: string, status: "ready" | "rejected") => {
    const { error } = await supabase.from("applications").update({ status }).eq("id", id);
    if (error) {
      toast({ title: "Update failed", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: status === "ready" ? "Escrow released" : "Escrow refunded" });
    load();
  };

  if (!isAdmin) {
    return (
      <DashboardLayout>
        <p className="text-sm text-muted-foreground">Admins only.</p>
      </DashboardLayout>
    );
  }

  const held = apps.filter((a) => a.status !== "ready" && a.status !== "rejected");

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Escrow Management</h1>
          <p className="text-sm text-muted-foreground">{held.length} order(s) with funds held</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">All escrow orders</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading && <p className="text-sm text-muted-foreground">Loading...</p>}
            {!loading && apps.length === 0 && <p className="text-sm text-muted-foreground">No orders yet.</p>}
            {apps.map((a) => (
              <div key={a.id} className="flex flex-wrap items-center gap-3 border rounded-md p-3">
                <Lock className="h-4 w-4 text-primary" />
                <div className="flex-1 min-w-[160px]">
                  <p className="text-sm font-medium text-foreground">
                    {serviceLabels[a.service_type] || a.service_type}
                  </p>
                  <p className="text-xs text-muted-foreground font-mono">{a.id.slice(0, 8)}</p>
                </div>
                <Badge variant={a.status === "ready" ? "default" : a.status === "rejected" ? "destructive" : "secondary"}>
                  {statusLabels[a.status] || a.status}
                </Badge>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => update(a.id, "ready")} disabled={a.status === "ready"}>
                    <ShieldCheck className="h-4 w-4 mr-1" /> Release
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => update(a.id, "rejected")}
                    disabled={a.status === "rejected"}
                  >
                    <XCircle className="h-4 w-4 mr-1" /> Refund
                  </Button>
                  <Link to={`/dashboard/application/${a.id}`}>
                    <Button size="sm" variant="ghost">
                      View
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default AdminEscrow;
