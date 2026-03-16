import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Upload, Camera, FileText, CreditCard, CheckCircle, ArrowRight, ArrowLeft } from "lucide-react";

const steps = [
  { key: "photo", label: "Your Photo", icon: Camera, description: "Upload a clear photo of yourself" },
  { key: "id_document", label: "ID Document", icon: FileText, description: "Upload your identification document" },
  { key: "w2_form", label: "W-2 Form", icon: FileText, description: "Upload your W-2 form" },
  { key: "payment_proof", label: "Payment Proof", icon: CreditCard, description: "Upload proof of payment (receipt/screenshot)" },
];

const NewApplication = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(0);
  const [files, setFiles] = useState<Record<string, File | null>>({});
  const [previews, setPreviews] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const handleFileChange = (stepKey: string, file: File | null) => {
    setFiles((prev) => ({ ...prev, [stepKey]: file }));
    if (file) {
      const url = URL.createObjectURL(file);
      setPreviews((prev) => ({ ...prev, [stepKey]: url }));
    } else {
      setPreviews((prev) => {
        const copy = { ...prev };
        delete copy[stepKey];
        return copy;
      });
    }
  };

  const handleSubmit = async () => {
    if (!user) return;

    // Check all files are uploaded
    const missing = steps.filter((s) => !files[s.key]);
    if (missing.length > 0) {
      toast({
        title: "Missing documents",
        description: `Please upload: ${missing.map((m) => m.label).join(", ")}`,
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);

    try {
      // Create application
      const { data: app, error: appError } = await supabase
        .from("applications")
        .insert({
          user_id: user.id,
          estimated_completion: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        })
        .select()
        .single();

      if (appError) throw appError;

      // Upload each file
      for (const step of steps) {
        const file = files[step.key]!;
        const ext = file.name.split(".").pop();
        const filePath = `${user.id}/${app.id}/${step.key}.${ext}`;

        const bucket = step.key === "payment_proof" ? "payment-proofs" : "documents";
        const { error: uploadError } = await supabase.storage
          .from(bucket)
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { error: docError } = await supabase.from("documents").insert({
          application_id: app.id,
          user_id: user.id,
          doc_type: step.key,
          file_path: filePath,
          file_name: file.name,
        });

        if (docError) throw docError;
      }

      toast({ title: "Application submitted!", description: "Your documents are being reviewed." });
      navigate("/dashboard");
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const step = steps[currentStep];

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-foreground mb-6">New Application</h1>

        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-8">
          {steps.map((s, i) => (
            <div key={s.key} className="flex items-center gap-2 flex-1">
              <button
                onClick={() => setCurrentStep(i)}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                  i === currentStep
                    ? "bg-primary text-primary-foreground"
                    : files[s.key]
                    ? "bg-primary/20 text-primary"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {files[s.key] ? <CheckCircle className="h-4 w-4" /> : i + 1}
              </button>
              {i < steps.length - 1 && (
                <div className={`h-0.5 flex-1 ${files[s.key] ? "bg-primary/30" : "bg-muted"}`} />
              )}
            </div>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <step.icon className="h-5 w-5 text-primary" />
              {step.label}
            </CardTitle>
            <CardDescription>{step.description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Preview */}
            {previews[step.key] && (
              <div className="border rounded-md overflow-hidden bg-muted">
                <img
                  src={previews[step.key]}
                  alt="Preview"
                  className="max-h-48 mx-auto object-contain p-2"
                />
              </div>
            )}

            {/* File input */}
            <div className="space-y-2">
              <Label htmlFor="file-upload">
                {files[step.key] ? files[step.key]!.name : "Choose file"}
              </Label>
              <Input
                id="file-upload"
                type="file"
                accept="image/*,.pdf"
                onChange={(e) => handleFileChange(step.key, e.target.files?.[0] || null)}
              />
              <p className="text-xs text-muted-foreground">
                Accepted: JPG, PNG, PDF. Max 10MB.
              </p>
            </div>

            {/* Navigation */}
            <div className="flex justify-between pt-4">
              <Button
                variant="outline"
                onClick={() => setCurrentStep((p) => p - 1)}
                disabled={currentStep === 0}
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back
              </Button>

              {currentStep < steps.length - 1 ? (
                <Button
                  onClick={() => setCurrentStep((p) => p + 1)}
                  disabled={!files[step.key]}
                >
                  Next
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              ) : (
                <Button onClick={handleSubmit} disabled={submitting}>
                  {submitting ? "Submitting..." : "Submit Application"}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default NewApplication;
