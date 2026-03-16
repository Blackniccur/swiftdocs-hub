import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { FileText, CheckCircle, Clock, XCircle, AlertCircle } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

const statusLabels: Record<string, string> = {
  submitted: "Submitted",
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

const docTypeLabels: Record<string, string> = {
  photo: "Your Photo",
  id_document: "ID Document",
  w2_form: "W-2 Form",
  payment_proof: "Payment Proof",
};

const ApplicationDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [application, setApplication] = useState<Tables<"applications"> | null>(null);
  const [documents, setDocuments] = useState<Tables<"documents">[]>([]);
  const [payments, setPayments] = useState<Tables<"payments">[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !id) return;
    const fetch = async () => {
      const [appRes, docsRes, payRes] = await Promise.all([
        supabase.from("applications").select("*").eq("id", id).single(),
        supabase.from("documents").select("*").eq("application_id", id),
        supabase.from("payments").select("*").eq("application_id", id),
      ]);
      setApplication(appRes.data);
      setDocuments(docsRes.data || []);
      setPayments(payRes.data || []);
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
        <div className="text-center py-12 text-muted-foreground">Application not found.</div>
      </DashboardLayout>
    );
  }

  const getDocStatusIcon = (status: string) => {
    if (status === "approved") return <CheckCircle className="h-4 w-4 text-green-600" />;
    if (status === "rejected") return <XCircle className="h-4 w-4 text-destructive" />;
    return <Clock className="h-4 w-4 text-muted-foreground" />;
  };

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">
            Application #{application.id.slice(0, 8)}
          </h1>
          <Badge
            variant={
              application.status === "ready"
                ? "default"
                : application.status === "rejected"
                ? "destructive"
                : "secondary"
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
              <span>Created: {new Date(application.created_at).toLocaleDateString()}</span>
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

        {/* Documents */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Documents</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between border rounded-md p-3"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {docTypeLabels[doc.doc_type] || doc.doc_type}
                      </p>
                      <p className="text-xs text-muted-foreground">{doc.file_name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getDocStatusIcon(doc.status)}
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
                      <p className="text-sm font-medium text-foreground">
                        {pay.payment_method === "stripe" ? "Stripe Payment" : "Uploaded Proof"}
                      </p>
                      {pay.reference_number && (
                        <p className="text-xs text-muted-foreground">Ref: {pay.reference_number}</p>
                      )}
                    </div>
                    <Badge
                      variant={
                        pay.status === "verified" ? "default" : pay.status === "rejected" ? "destructive" : "secondary"
                      }
                    >
                      {pay.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ApplicationDetail;
