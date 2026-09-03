import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  CreditCard,
  DollarSign,
  LayoutDashboard,
  PackageOpen,
  Users,
} from "lucide-react";
import { serviceLabels, statusLabels } from "@/lib/services";

type Stats = {
  users: number;
  orders: number;
  openOrders: number;
  pendingPayments: number;
  deliverables: number;
  activeServices: number;
  balanceTotal: number;
};

const AdminOverview = () => {
  const { isAdmin, loading: authLoading } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);

  useEffect(() => {
    if (!isAdmin) return;
    const load = async () => {
      const count = { count: "exact" as const, head: true };
      const [profiles, orders, openOrders, payments, deliverables, services, balances, recent] = await Promise.all([
        supabase.from("profiles").select("id", count),
        supabase.from("applications").select("id", count),
        supabase.from("applications").select("id", count).neq("status", "ready"),
        supabase.from("payments").select("id", count).eq("status", "pending"),
        supabase.from("deliverables").select("id", count),
        supabase.from("service_prices").select("id", count).eq("is_active", true),
        supabase.from("profiles").select("balance"),
        supabase.from("applications").select("*").order("created_at", { ascending: false }).limit(6),
      ]);

      setStats({
        users: profiles.count || 0,
        orders: orders.count || 0,
        openOrders: openOrders.count || 0,
        pendingPayments: payments.count || 0,
        deliverables: deliverables.count || 0,
        activeServices: services.count || 0,
        balanceTotal: (balances.data || []).reduce((sum, p: any) => sum + Number(p.balance || 0), 0),
      });
      setRecentOrders(recent.data || []);
    };
    load();
  }, [isAdmin]);

  if (authLoading) return null;
  if (!isAdmin) return <Navigate to="/dashboard" replace />;

  const cards = [
    { label: "Clients", value: stats?.users ?? "—", icon: Users, href: "/admin/users" },
    { label: "Orders", value: stats?.orders ?? "—", icon: LayoutDashboard, href: "/admin" },
    { label: "Open orders", value: stats?.openOrders ?? "—", icon: LayoutDashboard, href: "/admin" },
    { label: "Pending payments", value: stats?.pendingPayments ?? "—", icon: CreditCard, href: "/admin/payments" },
    { label: "Deliverables", value: stats?.deliverables ?? "—", icon: PackageOpen, href: "/admin/deliverables" },
    { label: "Active services", value: stats?.activeServices ?? "—", icon: DollarSign, href: "/admin/pricing" },
  ];

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-6xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Admin Control Center</h1>
          <p className="text-sm text-muted-foreground">
            Manage services, users, payments, orders and deliverables from one place.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((card) => (
            <Link key={card.label} to={card.href}>
              <Card className="transition-colors hover:border-primary/50">
                <CardContent className="flex items-center justify-between p-5">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">{card.label}</p>
                    <p className="mt-1 text-2xl font-bold text-foreground">{card.value}</p>
                  </div>
                  <card.icon className="h-6 w-6 text-primary" />
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="text-base">Client wallet balances</CardTitle>
              <CardDescription>Total funds held across all client accounts</CardDescription>
            </div>
            <p className="text-xl font-bold text-foreground">${(stats?.balanceTotal ?? 0).toFixed(2)}</p>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">Recent orders</CardTitle>
            <Button asChild variant="outline" size="sm">
              <Link to="/admin">
                All orders <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {recentOrders.length === 0 ? (
              <p className="text-sm text-muted-foreground">No orders yet.</p>
            ) : (
              recentOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between rounded-md border p-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {serviceLabels[order.service_type] || order.service_type}
                    </p>
                    <p className="font-mono text-xs text-muted-foreground">
                      #{order.id.slice(0, 8)} · {new Date(order.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge variant={order.status === "ready" ? "default" : order.status === "rejected" ? "destructive" : "secondary"}>
                    {statusLabels[order.status] || order.status}
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default AdminOverview;
