import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, CheckCircle, Search, Shield, ShieldCheck, Sparkles, Terminal } from "lucide-react";
import { categoryList, iconMap, serviceCategories, type ServicePrice } from "@/lib/services";
import heroBg from "@/assets/dark-hero.jpg";

const Index = () => {
  const [services, setServices] = useState<ServicePrice[]>([]);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");

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

  const filteredServices = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return services.filter((service) => {
      const matchesCategory = category === "All" || serviceCategories[service.service_key] === category;
      const matchesQuery = !normalizedQuery || `${service.label} ${service.description}`.toLowerCase().includes(normalizedQuery);
      return matchesCategory && matchesQuery;
    });
  }, [category, query, services]);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-5 px-4 sm:px-6">
          <Link to="/" className="flex shrink-0 items-center gap-2.5" aria-label="AccelDocs home">
            <span className="flex h-9 w-9 items-center justify-center rounded-md border border-primary/40 bg-primary/10">
              <Terminal className="h-5 w-5 text-primary" />
            </span>
            <span className="text-base font-bold uppercase tracking-[0.16em] text-foreground">Accel<span className="text-primary">Docs</span></span>
          </Link>
          <div className="relative hidden max-w-xl flex-1 md:block">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search services..."
              className="h-10 border-border bg-secondary/60 pl-10"
              aria-label="Search services"
            />
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link to="/auth?mode=signin">Log in</Link>
            </Button>
            <Button asChild size="sm">
              <Link to="/auth?mode=signup">Create account</Link>
            </Button>
          </div>
        </div>
      </header>

      <main>
      <section className="relative min-h-[420px] overflow-hidden border-b border-border">
        <img
          src={heroBg}
          alt="Digital marketplace workspace"
          width={1536}
          height={1024}
          className="absolute inset-0 h-full w-full object-cover opacity-35"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/70 to-background" />
        <div className="market-grid absolute inset-0 opacity-40" />
        <div className="relative mx-auto flex max-w-7xl flex-col items-center px-4 pb-20 pt-20 text-center sm:px-6 md:pb-24 md:pt-24">
          <div className="mb-5 flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary">
            <Sparkles className="h-3.5 w-3.5" />
            Curated digital services
          </div>
          <h1 className="max-w-4xl text-4xl font-extrabold leading-[1.08] text-foreground sm:text-5xl md:text-6xl">
            Find the right service.<br className="hidden sm:block" /> Start earning faster.
          </h1>
          <p className="mt-5 max-w-2xl text-sm leading-6 text-muted-foreground md:text-base">
            Browse verified document processing, AI platform profiles, and practical courses from one secure marketplace.
          </p>
          <div className="relative mt-8 w-full max-w-2xl md:hidden">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search the marketplace..."
              className="h-12 border-border bg-card/90 pl-12"
              aria-label="Search marketplace"
            />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 md:py-16">
        <div className="mb-8 flex flex-col gap-5 border-b border-border pb-7 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="mb-2 font-mono text-xs uppercase text-primary">Marketplace / Catalog</p>
            <h2 className="text-2xl font-bold text-foreground md:text-3xl">Explore services</h2>
            <p className="mt-2 text-sm text-muted-foreground">Clear pricing, secure ordering, and tracked delivery.</p>
          </div>
          <div className="flex flex-wrap gap-2" aria-label="Service categories">
            {categoryList.map((item) => (
              <Button
                key={item}
                type="button"
                size="sm"
                variant={category === item ? "default" : "outline"}
                onClick={() => setCategory(item)}
              >
                {item}
              </Button>
            ))}
          </div>
        </div>

        {filteredServices.length === 0 ? (
          <div className="border border-dashed border-border py-16 text-center">
            <Search className="mx-auto mb-3 h-6 w-6 text-muted-foreground" />
            <p className="font-medium text-foreground">No services found</p>
            <p className="mt-1 text-sm text-muted-foreground">Try a different search or category.</p>
          </div>
        ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredServices.map((service) => {
            const Icon = iconMap[service.icon_name] || Shield;
            return (
              <Card
                key={service.id}
                className="group flex min-h-[330px] flex-col overflow-hidden border-border bg-card transition-all duration-300 hover:-translate-y-1 hover:border-primary/50 hover:shadow-[var(--shadow-glow)]"
              >
                <CardHeader className="border-b border-border pb-5">
                  <div className="mb-4 flex items-start justify-between gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-md border border-primary/30 bg-primary/10">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <span className="rounded-full border border-border bg-secondary px-2.5 py-1 font-mono text-[10px] uppercase text-muted-foreground">
                      {serviceCategories[service.service_key] || "Service"}
                    </span>
                  </div>
                  <CardTitle className="text-lg leading-snug">{service.label}</CardTitle>
                  <CardDescription className="line-clamp-2 text-sm leading-6">{service.description}</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col pt-5">
                  <ul className="mb-6 flex-1 space-y-2">
                    {service.features.slice(0, 3).map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <div className="flex items-center justify-between gap-4 border-t border-border pt-5">
                    <div>
                      <p className="text-[10px] uppercase text-muted-foreground">Starting at</p>
                      <p className="text-2xl font-bold text-foreground">${service.price}</p>
                    </div>
                    <Button asChild>
                      <Link to={`/auth?mode=signup&service=${service.service_key}`}>
                        Get started <ArrowRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
        )}
      </section>

      <section className="border-y border-border bg-card/40">
        <div className="mx-auto grid max-w-7xl gap-px bg-border sm:grid-cols-3">
          {[
            ["01", "Choose", "Compare services and transparent pricing."],
            ["02", "Order", "Create an account and complete your payment."],
            ["03", "Track", "Follow every update through secure delivery."],
          ].map(([number, title, description]) => (
            <div key={number} className="bg-background px-6 py-9">
              <p className="mb-5 font-mono text-xs text-primary">{number}</p>
              <h3 className="font-semibold text-foreground">{title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-12 sm:px-6 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-3">
          <ShieldCheck className="mt-1 h-6 w-6 shrink-0 text-primary" />
          <div>
            <h2 className="text-xl font-bold text-foreground">Ready to access the marketplace?</h2>
            <p className="mt-1 text-sm text-muted-foreground">Create your account and manage orders from one dashboard.</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline"><Link to="/auth?mode=signin">Log in</Link></Button>
          <Button asChild><Link to="/auth?mode=signup">Create account</Link></Button>
        </div>
      </section>
      </main>

      <footer className="border-t border-border py-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p>© {new Date().getFullYear()} AccelDocs. All rights reserved.</p>
          <p>Secure digital marketplace</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
