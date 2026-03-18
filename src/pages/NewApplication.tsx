import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Upload, CheckCircle, Shield, Camera } from "lucide-react";
import { iconMap, type ServicePrice } from "@/lib/services";

const NewApplication = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const preselected = searchParams.get("service") || "";

  const [services, setServices] = useState<ServicePrice[]>([]);
  const [selectedService, setSelectedService] = useState(preselected);
  const [passportFile, setPassportFile] = useState<File | null>(null);
  const [passportPreview, setPassportPreview] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    supabase
      .from("service_prices")
      .select("*")
      .eq("is_active", true)
      .order("display_order")
      .then(({ data }) => {
        if (data) {
          setServices(
            data.map((d: any) => ({
              ...d,
              features: Array.isArray(d.features) ? d.features : JSON.parse(d.features || "[]"),
            }))
          );
        }
      });
  }, []);

  const handleFileChange = (file: File | null) => {
    setPassportFile(file);
    setPassportPreview(file ? URL.createObjectURL(file) : "");
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

      const ext = passportFile.name.split(".").pop();
      const filePath = `${user.id}/${app.id}/passport.${ext}`;
      const { error: uploadError } = await supabase.storage.from("documents").upload(filePath, passportFile);
      if (uploadError) throw uploadError;

      await supabase.from("documents").insert({
        application_id: app.id,
        user_id: user.id,
        doc_type: "passport",
        file_path: filePath,
        file_name: passportFile.name,
      });

      toast({ title: "Order placed!", description: "Upload your payment proof to proceed." });
      navigate("/dashboard/payments");
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const selectedSvc = services.find((s) => s.service_key === selectedService);

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-foreground">Purchase a Service</h1>

        {/* Step 1: Select service */}
        <div>
          <h2 className="text-sm font-medium text-muted-foreground mb-3">Step 1: Select a Service</h2>
          <div className="grid gap-3">
            {services.map((s) => {
              const Icon = iconMap[s.icon_name] || Shield;
              return (
                <Card
                  key={s.service_key}
                  className={`cursor-pointer transition-all ${
                    selectedService === s.service_key ? "ring-2 ring-primary" : "hover:shadow-md"
                  }`}
                  onClick={() => setSelectedService(s.service_key)}
                >
                  <CardContent className="flex items-center gap-4 p-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                      selectedService === s.service_key ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary"
                    }`}>
                      {selectedService === s.service_key ? <CheckCircle className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-foreground">{s.label}</p>
                      <p className="text-xs text-muted-foreground">{s.description}</p>
                    </div>
                    <span className="text-lg font-bold text-foreground">${s.price}</span>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Step 2: Upload passport photo */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Camera className="h-5 w-5 text-primary" />
              Step 2: Upload Your Passport Photo
            </CardTitle>
            <CardDescription>
              Upload a clear photo of yourself <strong>from the chest up to the head</strong>. 
              This will be used for your driving license or account verification. 
              Make sure the photo is well-lit, facing forward, with a plain background.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Visual guide */}
            <div className="bg-muted/50 border border-dashed rounded-lg p-4 text-center">
              <div className="w-24 h-32 mx-auto bg-primary/10 rounded-lg flex items-center justify-center mb-2 border-2 border-primary/30">
                <div className="text-center">
                  <div className="w-10 h-10 rounded-full bg-primary/20 mx-auto mb-1" />
                  <div className="w-14 h-8 bg-primary/15 rounded-t-lg mx-auto" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground font-medium">Chest to head — facing forward</p>
            </div>

            {passportPreview && (
              <div className="border rounded-md overflow-hidden bg-muted">
                <img src={passportPreview} alt="Passport preview" className="max-h-48 mx-auto object-contain p-2" />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="passport">Photo (chest to head)</Label>
              <Input
                id="passport"
                type="file"
                accept="image/*"
                onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
              />
              <p className="text-xs text-muted-foreground">Accepted: JPG, PNG. Max 10MB. Photo must show from chest to head.</p>
            </div>
          </CardContent>
        </Card>

        {selectedSvc && (
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 text-sm">
            <p className="font-medium text-foreground">Order Summary</p>
            <p className="text-muted-foreground">{selectedSvc.label} — <strong>${selectedSvc.price}</strong></p>
          </div>
        )}

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
