import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Car, Briefcase, Bot, Plus, Clock, CheckCircle, AlertCircle, ShoppingBag } from "lucide-react";

const serviceLabels: Record<string, string> = {
  driving_license: "Driving License",
  outlier_account: "Outlier Account",
  handshake_ai: "Handshake AI",
};

const serviceIcons: Record<string, typeof Car> = {
  driving_license: Car,
  outlier_account: Briefcase,
  handshake_ai: Bot,
};

const statusLabels: Record<string, string> = {
  submitted: "Order Placed",
  documents_review: "Under Review",
  processing: "Processing",
  ready: "Ready",
  rejected: "Rejected",
};

const statusProgress: Record<string, number> = {
  submitted: 25,
  documents_review: 50,
  processing: 75,
  ready: 100,
  rejected: 0,
};

const Dashboard = () => {
  const { user } = useAuth();
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("applications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setApplications(data || []);
        setLoading(false);
      });
  }, [user]);

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">My Orders</h1>
            <p className="text-muted-foreground text-sm">Track your purchases and deliverables</p>
          </div>
          <Link to="/dashboard/new-application">
            <Button>
              <ShoppingBag className="h-4 w-4 mr-2" />
              New Purchase
            </Button>
          </Link>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : applications.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <ShoppingBag className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-1">No orders yet</h3>
              <p className="text-muted-foreground text-sm mb-4">
                Browse our services and place your first order.
              </p>
              <Link to="/dashboard/new-application">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Purchase a Service
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {applications.map((app) => {
              const ServiceIcon = serviceIcons[app.service_type] || Car;
              return (
                <Card key={app.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                          <ServiceIcon className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-base">
                            {serviceLabels[app.service_type] || app.service_type}
                          </CardTitle>
                          <p className="text-xs text-muted-foreground">Order #{app.id.slice(0, 8)}</p>
                        </div>
                      </div>
                      <Badge
                        variant={
                          app.status === "ready" ? "default" : app.status === "rejected" ? "destructive" : "secondary"
                        }
                      >
                        {statusLabels[app.status] || app.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <Progress value={statusProgress[app.status] || 0} className="h-2" />
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          <span>Ordered {new Date(app.created_at).toLocaleDateString()}</span>
                        </div>
                        {app.estimated_completion && (
                          <div className="flex items-center gap-1">
                            <CheckCircle className="h-3.5 w-3.5" />
                            <span>Est. {new Date(app.estimated_completion).toLocaleDateString()}</span>
                          </div>
                        )}
                      </div>
                      {app.status === "rejected" && app.admin_notes && (
                        <div className="flex items-start gap-2 bg-destructive/10 text-destructive rounded-md p-3 text-sm">
                          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                          <span>{app.admin_notes}</span>
                        </div>
                      )}
                      <Link to={`/dashboard/application/${app.id}`}>
                        <Button variant="outline" size="sm" className="mt-2">
                          View Details
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
