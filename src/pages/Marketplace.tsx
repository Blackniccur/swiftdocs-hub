import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Shield, ShoppingCart, CheckCircle, Plus, Minus, Trash2, Search } from "lucide-react";
import { iconMap, serviceCategories, categoryList, type ServicePrice } from "@/lib/services";
import { useCart } from "@/context/CartContext";
import { useToast } from "@/hooks/use-toast";

const Marketplace = () => {
  const [services, setServices] = useState<ServicePrice[]>([]);
  const [category, setCategory] = useState("All");
  const [query, setQuery] = useState("");
  const { items, add, setQty, remove, clear, count, total } = useCart();
  const navigate = useNavigate();
  const { toast } = useToast();

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

  const filtered = useMemo(
    () =>
      services.filter((s) => {
        const cat = serviceCategories[s.service_key] || "AI Platforms";
        const matchesCat = category === "All" || cat === category;
        const matchesQuery = s.label.toLowerCase().includes(query.toLowerCase());
        return matchesCat && matchesQuery;
      }),
    [services, category, query]
  );

  const checkout = () => {
    if (!items.length) return;
    const first = items[0];
    toast({
      title: "Continue to checkout",
      description: `Starting order for ${first.label}. Upload your photo to place the order.`,
    });
    navigate(`/dashboard/new-application?service=${first.service_key}`);
  };

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Marketplace</h1>
            <p className="text-muted-foreground text-sm">Browse verified accounts, documents and courses</p>
          </div>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" className="relative">
                <ShoppingCart className="h-4 w-4 mr-2" />
                Cart
                {count > 0 && (
                  <span className="absolute -top-2 -right-2 h-5 min-w-5 px-1 rounded-full bg-primary text-primary-foreground text-[11px] flex items-center justify-center">
                    {count}
                  </span>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent className="flex flex-col">
              <SheetHeader>
                <SheetTitle>Your Cart</SheetTitle>
              </SheetHeader>
              <div className="flex-1 overflow-auto py-4 space-y-3">
                {items.length === 0 && <p className="text-sm text-muted-foreground">Your cart is empty.</p>}
                {items.map((i) => (
                  <div key={i.service_key} className="flex items-center gap-3 border rounded-md p-3">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">{i.label}</p>
                      <p className="text-xs text-muted-foreground">${Number(i.price).toFixed(2)} each</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button size="icon" variant="ghost" onClick={() => setQty(i.service_key, i.qty - 1)}>
                        <Minus className="h-3.5 w-3.5" />
                      </Button>
                      <span className="w-6 text-center text-sm">{i.qty}</span>
                      <Button size="icon" variant="ghost" onClick={() => setQty(i.service_key, i.qty + 1)}>
                        <Plus className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => remove(i.service_key)}>
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="border-t pt-4 space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Total</span>
                  <span className="font-bold text-foreground">${total.toFixed(2)}</span>
                </div>
                <Button className="w-full" disabled={!items.length} onClick={checkout}>
                  Checkout
                </Button>
                <Button variant="ghost" className="w-full" disabled={!items.length} onClick={clear}>
                  Clear cart
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search products"
              className="pl-9"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {categoryList.map((c) => (
              <Button key={c} size="sm" variant={category === c ? "default" : "outline"} onClick={() => setCategory(c)}>
                {c}
              </Button>
            ))}
          </div>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((s) => {
            const Icon = iconMap[s.icon_name] || Shield;
            return (
              <Card key={s.id} className="flex flex-col border-border/70 bg-card/70">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="w-11 h-11 rounded-md bg-primary/10 border border-primary/30 flex items-center justify-center">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <Badge variant="secondary">{serviceCategories[s.service_key] || "AI Platforms"}</Badge>
                  </div>
                  <CardTitle className="text-base mt-3">{s.label}</CardTitle>
                  <CardDescription className="text-sm">{s.description}</CardDescription>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col">
                  <p className="text-2xl font-bold text-primary mb-3">${Number(s.price).toFixed(2)}</p>
                  <ul className="space-y-1.5 mb-4 flex-1">
                    {s.features.slice(0, 4).map((f) => (
                      <li key={f} className="flex items-start gap-2 text-xs text-muted-foreground">
                        <CheckCircle className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <div className="flex gap-2">
                    <Button
                      className="flex-1"
                      variant="outline"
                      onClick={() => {
                        add({ service_key: s.service_key, label: s.label, price: Number(s.price) });
                        toast({ title: "Added to cart", description: s.label });
                      }}
                    >
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      Add
                    </Button>
                    <Button className="flex-1" onClick={() => navigate(`/dashboard/new-application?service=${s.service_key}`)}>
                      Buy now
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
        {filtered.length === 0 && <p className="text-sm text-muted-foreground text-center py-10">No products found.</p>}
      </div>
    </DashboardLayout>
  );
};

export default Marketplace;
