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
import { Upload, Wallet } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

const paymentMethods = [
  { value: "binance", label: "Binance (Crypto)" },
  { value: "mpesa", label: "M-Pesa" },
];

const Payments = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [applications, setApplications] = useState<any[]>([]);
  const [payments, setPayments] = useState<Tables<"payments">[]>([]);
  const [selectedApp, setSelectedApp] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  const serviceLabels: Record<string, string> = {
    driving_license: "Driving License",
    outlier_account: "Outlier Account",
    handshake_ai: "Handshake AI",
    mercor_ai: "Mercor AI",
    full_course: "Freelancing AI Course",
  };

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
    if (!user || !selectedApp || !proofFile || !paymentMethod) return;

    setSubmitting(true);
    try {
      const ext = proofFile.name.split(".").pop();
      const filePath = `${user.id}/${selectedApp}/proof_${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage.from("payment-proofs").upload(filePath, proofFile);
      if (uploadError) throw uploadError;

      const { error } = await supabase.from("payments").insert({
        application_id: selectedApp,
        user_id: user.id,
        payment_method: paymentMethod,
        proof_file_path: filePath,
        reference_number: referenceNumber || null,
      });
      if (error) throw error;

      toast({ title: "Payment proof uploaded!", description: "It will be verified by our team." });

      const { data } = await supabase.from("payments").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
      setPayments(data || []);
      setSelectedApp("");
      setPaymentMethod("");
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
        <h1 className="text-2xl font-bold text-foreground">Payment Verification</h1>

        {/* Payment instructions */}
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Wallet className="h-5 w-5 text-primary mt-0.5" />
              <div className="text-sm space-y-1">
                <p className="font-medium text-foreground">Payment Instructions</p>
                <p className="text-muted-foreground">
                  <strong>Binance:</strong> Send payment to wallet address <code className="bg-muted px-1 rounded">0x1234...abcd</code>
                </p>
                <p className="text-muted-foreground">
                  <strong>M-Pesa:</strong> Send to paybill <code className="bg-muted px-1 rounded">123456</code>, account: your email
                </p>
                <p className="text-muted-foreground">After paying, upload your receipt/screenshot below.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Upload payment proof */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Upload className="h-5 w-5 text-primary" />
              Upload Payment Proof
            </CardTitle>
            <CardDescription>
              Upload a screenshot or receipt of your Binance or M-Pesa payment.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUploadProof} className="space-y-4">
              <div className="space-y-2">
                <Label>Order</Label>
                <Select value={selectedApp} onValueChange={setSelectedApp}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select order" />
                  </SelectTrigger>
                  <SelectContent>
                    {applications.map((app) => (
                      <SelectItem key={app.id} value={app.id}>
                        {serviceLabels[app.service_type] || app.service_type} — #{app.id.slice(0, 8)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
              <div className="space-y-2">
                <Label htmlFor="proof">Payment Receipt / Screenshot</Label>
                <Input
                  id="proof"
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => setProofFile(e.target.files?.[0] || null)}
                />
              </div>
              <Button type="submit" disabled={submitting || !selectedApp || !proofFile || !paymentMethod}>
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
                      <p className="text-sm font-medium text-foreground capitalize">
                        {pay.payment_method} Payment
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(pay.created_at).toLocaleDateString()}
                      </p>
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
      </div>
    </DashboardLayout>
  );
};

export default Payments;
