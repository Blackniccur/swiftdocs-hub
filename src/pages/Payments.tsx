import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { CreditCard, Upload } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

const Payments = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [applications, setApplications] = useState<Tables<"applications">[]>([]);
  const [payments, setPayments] = useState<Tables<"payments">[]>([]);
  const [selectedApp, setSelectedApp] = useState("");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const [appRes, payRes] = await Promise.all([
        supabase.from("applications").select("*").eq("user_id", user.id),
        supabase.from("payments").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
      ]);
      setApplications(appRes.data || []);
      setPayments(payRes.data || []);
      setLoading(false);
    };
    fetch();
  }, [user]);

  const handleUploadProof = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedApp || !proofFile) return;

    setSubmitting(true);
    try {
      const ext = proofFile.name.split(".").pop();
      const filePath = `${user.id}/${selectedApp}/proof_${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("payment-proofs")
        .upload(filePath, proofFile);
      if (uploadError) throw uploadError;

      const { error } = await supabase.from("payments").insert({
        application_id: selectedApp,
        user_id: user.id,
        payment_method: "upload",
        proof_file_path: filePath,
        reference_number: referenceNumber || null,
      });
      if (error) throw error;

      toast({ title: "Payment proof uploaded!", description: "It will be verified by our team." });

      // Refresh
      const { data } = await supabase.from("payments").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
      setPayments(data || []);
      setSelectedApp("");
      setReferenceNumber("");
      setProofFile(null);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-foreground">Payments</h1>

        {/* Upload payment proof */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Upload className="h-5 w-5 text-primary" />
              Upload Payment Proof
            </CardTitle>
            <CardDescription>
              Upload a screenshot or receipt of your payment along with the reference number.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUploadProof} className="space-y-4">
              <div className="space-y-2">
                <Label>Application</Label>
                <Select value={selectedApp} onValueChange={setSelectedApp}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select application" />
                  </SelectTrigger>
                  <SelectContent>
                    {applications.map((app) => (
                      <SelectItem key={app.id} value={app.id}>
                        Application #{app.id.slice(0, 8)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="ref">Reference Number (optional)</Label>
                <Input
                  id="ref"
                  value={referenceNumber}
                  onChange={(e) => setReferenceNumber(e.target.value)}
                  placeholder="e.g. TXN-123456"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="proof">Payment Receipt / Screenshot</Label>
                <Input
                  id="proof"
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => setProofFile(e.target.files?.[0] || null)}
                />
              </div>
              <Button type="submit" disabled={submitting || !selectedApp || !proofFile}>
                {submitting ? "Uploading..." : "Upload Proof"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Payment history */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Payment History</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-6">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
              </div>
            ) : payments.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No payments yet.</p>
            ) : (
              <div className="space-y-3">
                {payments.map((pay) => (
                  <div key={pay.id} className="flex items-center justify-between border rounded-md p-3">
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        App #{pay.application_id.slice(0, 8)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {pay.payment_method === "stripe" ? "Stripe" : "Upload"} •{" "}
                        {new Date(pay.created_at).toLocaleDateString()}
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
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Payments;
