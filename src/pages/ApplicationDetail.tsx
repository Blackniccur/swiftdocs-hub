import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import ChatWidget from "@/components/ChatWidget";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { FileText, CheckCircle, Clock, XCircle, AlertCircle, Download, Car, Briefcase, Bot } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

const serviceLabels: Record<string, string> = {
  driving_license: "Driving License",
  outlier_account: "Outlier Account",
  handshake_ai: "Handshake AI Account",
  mercor_ai: "Mercor AI Account",
  full_course: "Freelancing AI Course",
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

const ApplicationDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [application, setApplication] = useState<any>(null);
  const [documents, setDocuments] = useState<Tables<"documents">[]>([]);
  const [deliverables, setDeliverables] = useState<any[]>([]);
  const [payments, setPayments] = useState<Tables<"payments">[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !id) return;
    const fetch = async () => {
      const [appRes, docsRes, payRes, delRes] = await Promise.all([
        supabase.from("applications").select("*").eq("id", id).single(),
        supabase.from("documents").select("*").eq("application_id", id),
        supabase.from("payments").select("*").eq("application_id", id),
        supabase.from("deliverables").select("*").eq("application_id", id),
      ]);
      setApplication(appRes.data);
      setDocuments(docsRes.data || []);
      setPayments(payRes.data || []);
      setDeliverables(delRes.data || []);
      setLoading(false);
    };
    fetch();
  }, [user, id]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (!application) {
    return (
      <DashboardLayout>
        <div className="text-center py-12 text-muted-foreground">Order not found.</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {serviceLabels[application.service_type] || application.service_type}
            </h1>
            <p className="text-sm text-muted-foreground">Order #{application.id.slice(0, 8)}</p>
          </div>
          <Badge
            variant={
              application.status === "ready" ? "default" : application.status === "rejected" ? "destructive" : "secondary"
            }
          >
            {statusLabels[application.status]}
          </Badge>
        </div>

        {/* Progress */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Processing Status</CardTitle>
          </CardHeader>
          <CardContent>
            <Progress value={statusProgress[application.status] || 0} className="h-3 mb-3" />
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>Ordered: {new Date(application.created_at).toLocaleDateString()}</span>
              {application.estimated_completion && (
                <span>Est. completion: {new Date(application.estimated_completion).toLocaleDateString()}</span>
              )}
            </div>
            {application.status === "rejected" && application.admin_notes && (
              <div className="mt-3 flex items-start gap-2 bg-destructive/10 text-destructive p-3 rounded-md text-sm">
                <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                <span>{application.admin_notes}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Deliverables from admin */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Download className="h-5 w-5 text-primary" />
              Deliverables
            </CardTitle>
          </CardHeader>
          <CardContent>
            {deliverables.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No deliverables yet. They will appear here once processed by our team.
              </p>
            ) : (
              <div className="space-y-3">
                {deliverables.map((del: any) => (
                  <div key={del.id} className="flex items-center justify-between border rounded-md p-3">
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-primary" />
                      <div>
                        <p className="text-sm font-medium text-foreground">{del.doc_type}</p>
                        <p className="text-xs text-muted-foreground">{del.file_name}</p>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {new Date(del.created_at).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Your uploads */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Your Uploaded Documents</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {documents.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between border rounded-md p-3">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium text-foreground">{doc.doc_type}</p>
                      <p className="text-xs text-muted-foreground">{doc.file_name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {doc.status === "approved" && <CheckCircle className="h-4 w-4 text-primary" />}
                    {doc.status === "rejected" && <XCircle className="h-4 w-4 text-destructive" />}
                    {doc.status === "pending" && <Clock className="h-4 w-4 text-muted-foreground" />}
                    <span className="text-sm capitalize text-muted-foreground">{doc.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Payments */}
        {payments.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Payments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {payments.map((pay) => (
                  <div key={pay.id} className="flex items-center justify-between border rounded-md p-3">
                    <div>
                      <p className="text-sm font-medium text-foreground capitalize">{pay.payment_method} Payment</p>
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
            </CardContent>
          </Card>
        )}

        <div className="flex gap-3">
          <Link to="/dashboard/payments">
            <Button variant="outline">Upload Payment Proof</Button>
          </Link>
          <Link to="/dashboard/support">
            <Button variant="outline">Contact Support</Button>
          </Link>
        </div>
      </div>
      {id && <ChatWidget applicationId={id} />}
    </DashboardLayout>
  );
};

export default ApplicationDetail;
