import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Car, Briefcase, Bot, Upload, CheckCircle } from "lucide-react";

const serviceOptions = [
  { key: "driving_license", label: "Driving License", icon: Car, price: "$150", desc: "Processed in 5 business days" },
  { key: "outlier_account", label: "Outlier Account", icon: Briefcase, price: "$80", desc: "Account setup & optimization" },
  { key: "handshake_ai", label: "Handshake AI Account", icon: Bot, price: "$100", desc: "Premium AI career tools" },
];

const NewApplication = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const preselected = searchParams.get("service") || "";

  const [selectedService, setSelectedService] = useState(preselected);
  const [passportFile, setPassportFile] = useState<File | null>(null);
  const [passportPreview, setPassportPreview] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  const handleFileChange = (file: File | null) => {
    setPassportFile(file);
    if (file) {
      setPassportPreview(URL.createObjectURL(file));
    } else {
      setPassportPreview("");
    }
  };

  const handleSubmit = async () => {
    if (!user || !selectedService || !passportFile) return;

    setSubmitting(true);
    try {
      const { data: app, error: appError } = await supabase
        .from("applications")
        .insert({
          user_id: user.id,
          service_type: selectedService as any,
          estimated_completion: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        })
        .select()
        .single();

      if (appError) throw appError;

      // Upload passport
      const ext = passportFile.name.split(".").pop();
      const filePath = `${user.id}/${app.id}/passport.${ext}`;
      const { error: uploadError } = await supabase.storage.from("documents").upload(filePath, passportFile);
      if (uploadError) throw uploadError;

      const { error: docError } = await supabase.from("documents").insert({
        application_id: app.id,
        user_id: user.id,
        doc_type: "passport",
        file_path: filePath,
        file_name: passportFile.name,
      });
      if (docError) throw docError;

      toast({ title: "Order placed!", description: "Upload your payment proof to proceed." });
      navigate("/dashboard/payments");
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-foreground">Purchase a Service</h1>

        {/* Step 1: Select service */}
        <div>
          <h2 className="text-sm font-medium text-muted-foreground mb-3">Step 1: Select a Service</h2>
          <div className="grid gap-3">
            {serviceOptions.map((s) => (
              <Card
                key={s.key}
                className={`cursor-pointer transition-all ${
                  selectedService === s.key ? "ring-2 ring-primary" : "hover:shadow-md"
                }`}
                onClick={() => setSelectedService(s.key)}
              >
                <CardContent className="flex items-center gap-4 p-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                    selectedService === s.key ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary"
                  }`}>
                    {selectedService === s.key ? <CheckCircle className="h-5 w-5" /> : <s.icon className="h-5 w-5" />}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-foreground">{s.label}</p>
                    <p className="text-xs text-muted-foreground">{s.desc}</p>
                  </div>
                  <span className="text-lg font-bold text-foreground">{s.price}</span>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Step 2: Upload passport */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Upload className="h-5 w-5 text-primary" />
              Step 2: Upload Your Passport
            </CardTitle>
            <CardDescription>
              Upload a clear photo or scan of your passport for identity verification.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {passportPreview && (
              <div className="border rounded-md overflow-hidden bg-muted">
                <img src={passportPreview} alt="Passport preview" className="max-h-48 mx-auto object-contain p-2" />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="passport">Passport Photo/Scan</Label>
              <Input
                id="passport"
                type="file"
                accept="image/*,.pdf"
                onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
              />
              <p className="text-xs text-muted-foreground">Accepted: JPG, PNG, PDF. Max 10MB.</p>
            </div>
          </CardContent>
        </Card>

        <Button
          className="w-full"
          size="lg"
          onClick={handleSubmit}
          disabled={submitting || !selectedService || !passportFile}
        >
          {submitting ? "Placing Order..." : "Place Order"}
        </Button>
        <p className="text-xs text-muted-foreground text-center">
          After placing your order, you'll be redirected to upload your payment proof.
        </p>
      </div>
    </DashboardLayout>
  );
};

export default NewApplication;
