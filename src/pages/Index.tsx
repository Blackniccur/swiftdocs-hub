import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Clock, CheckCircle, CreditCard, Headphones } from "lucide-react";
import { iconMap, type ServicePrice } from "@/lib/services";

const Index = () => {
  const [services, setServices] = useState<ServicePrice[]>([]);

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

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <header className="border-b border-border/60 bg-background/80 backdrop-blur sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-md bg-primary/15 border border-primary/40 flex items-center justify-center">
              <Terminal className="h-5 w-5 text-primary" />
            </div>
            <span className="text-lg font-bold tracking-[0.2em] text-primary uppercase">AccelDocs</span>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/auth">
              <Button variant="outline" size="sm">Login</Button>
            </Link>
            <Link to="/auth">
              <Button size="sm">Create Account</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <img
          src={heroBg}
          alt="Secure digital marketplace background"
          width={1536}
          height={1024}
          className="absolute inset-0 h-full w-full object-cover opacity-45"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/70 via-background/70 to-background" />
        <div className="relative container mx-auto px-4 py-20 md:py-32 text-center">
          <p className="text-xs tracking-[0.35em] uppercase text-primary mb-4">Invite-only marketplace</p>
          <h1 className="text-4xl md:text-6xl font-extrabold text-foreground mb-5 max-w-3xl mx-auto leading-[1.05] tracking-tight">
            Documents &amp; AI Accounts, Delivered Fast
          </h1>
          <p className="text-sm md:text-base text-muted-foreground mb-8 max-w-xl mx-auto">
            Driving license processing, Outlier, Handshake AI and Mercor AI accounts. Top up with Binance or M-Pesa and track every order in your dashboard.
          </p>
          <div className="flex items-center justify-center gap-3">
            <Link to="/auth">
              <Button size="lg" className="text-base px-8">Browse Services</Button>
            </Link>
            <Link to="/auth">
              <Button size="lg" variant="outline" className="text-base px-8">Login</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Pricing Table */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-2xl md:text-3xl font-bold text-foreground text-center mb-3">Services &amp; Pricing</h2>
        <p className="text-muted-foreground text-center mb-10 max-w-lg mx-auto text-sm">
          Transparent pricing — pick a service and get started today.
        </p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {services.map((service) => {
            const Icon = iconMap[service.icon_name] || Shield;
            return (
              <Card
                key={service.id}
                className="relative overflow-hidden border-border/70 bg-card/70 backdrop-blur transition-all hover:border-primary/50 hover:shadow-[var(--shadow-glow)] flex flex-col"
              >
                <CardHeader>
                  <div className="w-12 h-12 rounded-md bg-primary/10 border border-primary/30 flex items-center justify-center mb-3">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-lg">{service.label}</CardTitle>
                  <CardDescription className="text-sm">{service.description}</CardDescription>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col">
                  <p className="text-3xl font-bold text-primary mb-4">${service.price}</p>
                  <ul className="space-y-2 mb-6 flex-1">
                    {service.features.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <CheckCircle className="h-4 w-4 text-primary shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Link to={`/auth?service=${service.service_key}`}>
                    <Button className="w-full">Purchase Now</Button>
                  </Link>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>


      {/* How it works */}
      <section className="bg-muted/50 py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold text-foreground text-center mb-10">How It Works</h2>
          <div className="grid md:grid-cols-4 gap-8 max-w-4xl mx-auto">
            {[
              { icon: CreditCard, title: "Choose & Pay", desc: "Select a service and pay via Binance or M-Pesa." },
              { icon: Shield, title: "Upload Passport", desc: "Upload a clear photo from chest to head." },
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
