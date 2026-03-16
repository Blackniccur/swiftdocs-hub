import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Shield, FileText, Clock, CheckCircle, Upload, CreditCard } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold text-foreground">DocVerify Pro</span>
          </div>
          <Link to="/auth">
            <Button>Get Started</Button>
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4 max-w-3xl mx-auto leading-tight">
          Document Processing & Verification Platform
        </h1>
        <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
          Upload your documents, verify payments, and get your application processed in just 5 business days.
        </p>
        <Link to="/auth">
          <Button size="lg" className="text-base px-8">
            Start Your Application
          </Button>
        </Link>
      </section>

      {/* Steps */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-2xl font-bold text-foreground text-center mb-12">How It Works</h2>
        <div className="grid md:grid-cols-4 gap-8 max-w-4xl mx-auto">
          {[
            { icon: Upload, title: "Upload Documents", desc: "Submit your photo, ID, and W-2 form securely." },
            { icon: CreditCard, title: "Verify Payment", desc: "Pay via Stripe or upload payment proof." },
            { icon: Clock, title: "Processing", desc: "Our team reviews and processes your application." },
            { icon: CheckCircle, title: "Ready in 5 Days", desc: "Get notified when your documents are ready." },
          ].map((step, i) => (
            <div key={i} className="text-center space-y-3">
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                <step.icon className="h-7 w-7 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground">{step.title}</h3>
              <p className="text-sm text-muted-foreground">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-card py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} DocVerify Pro. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default Index;
