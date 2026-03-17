import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Car, Briefcase, Bot, Clock, CheckCircle, CreditCard, Headphones } from "lucide-react";

const services = [
  {
    key: "driving_license",
    title: "Driving License",
    description: "Get your driving license processed in just 5 business days. Upload your passport and we handle the rest.",
    icon: Car,
    price: "$150",
    features: ["5-day processing", "Full verification", "Digital & physical copy"],
  },
  {
    key: "outlier_account",
    title: "Outlier Account",
    description: "Get a verified Outlier platform account set up and ready to use for remote work opportunities.",
    icon: Briefcase,
    price: "$80",
    features: ["Account setup", "Profile optimization", "Ready to earn"],
  },
  {
    key: "handshake_ai",
    title: "Handshake AI Account",
    description: "Get a fully configured Handshake AI account with premium access for career networking.",
    icon: Bot,
    price: "$100",
    features: ["Premium access", "AI-powered matching", "Career tools"],
  },
];

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <header className="border-b bg-card sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold text-foreground">AccelDocs</span>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/auth">
              <Button variant="outline" size="sm">Sign In</Button>
            </Link>
            <Link to="/auth">
              <Button size="sm">Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="container mx-auto px-4 py-16 md:py-24 text-center">
        <h1 className="text-3xl md:text-5xl font-bold text-foreground mb-4 max-w-3xl mx-auto leading-tight">
          Your One-Stop Marketplace for Document & Account Services
        </h1>
        <p className="text-base md:text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
          Purchase driving license processing, Outlier accounts, and Handshake AI accounts. Pay with Binance or M-Pesa.
        </p>
        <Link to="/auth">
          <Button size="lg" className="text-base px-8">
            Browse Services
          </Button>
        </Link>
      </section>

      {/* Services */}
      <section className="container mx-auto px-4 py-12">
        <h2 className="text-2xl font-bold text-foreground text-center mb-10">Our Services</h2>
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {services.map((service) => (
            <Card key={service.key} className="relative overflow-hidden hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                  <service.icon className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-lg">{service.title}</CardTitle>
                <CardDescription className="text-sm">{service.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-foreground mb-4">{service.price}</p>
                <ul className="space-y-2 mb-6">
                  {service.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CheckCircle className="h-4 w-4 text-primary shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link to="/auth">
                  <Button className="w-full">Purchase Now</Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="bg-muted/50 py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold text-foreground text-center mb-10">How It Works</h2>
          <div className="grid md:grid-cols-4 gap-8 max-w-4xl mx-auto">
            {[
              { icon: CreditCard, title: "Choose & Pay", desc: "Select a service and pay via Binance or M-Pesa." },
              { icon: Shield, title: "Upload Passport", desc: "Upload your passport photo for verification." },
              { icon: Clock, title: "We Process", desc: "Our team processes your order within 5 days." },
              { icon: CheckCircle, title: "Get Delivered", desc: "Download your documents from your dashboard." },
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
        </div>
      </section>

      {/* Support */}
      <section className="container mx-auto px-4 py-16 text-center">
        <div className="flex items-center justify-center gap-2 mb-3">
          <Headphones className="h-6 w-6 text-primary" />
          <h2 className="text-xl font-bold text-foreground">Need Help?</h2>
        </div>
        <p className="text-muted-foreground mb-4">Our support team is available to assist you with any questions.</p>
        <Link to="/dashboard/support">
          <Button variant="outline">Contact Support</Button>
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t bg-card py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} AccelDocs. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default Index;
