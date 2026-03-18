import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Navigate } from "react-router-dom";
import { DollarSign, Save } from "lucide-react";
import { iconMap } from "@/lib/services";

type PriceRow = {
  id: string;
  service_key: string;
  label: string;
  description: string;
  price: number;
  features: string[];
  icon_name: string;
  is_active: boolean;
  display_order: number;
};

const AdminPricing = () => {
  const { isAdmin, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [prices, setPrices] = useState<PriceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    if (!isAdmin) return;
    fetchPrices();
  }, [isAdmin]);

  const fetchPrices = async () => {
    const { data } = await supabase
      .from("service_prices")
      .select("*")
      .order("display_order");
    if (data) {
      setPrices(
        data.map((d: any) => ({
          ...d,
          features: Array.isArray(d.features) ? d.features : JSON.parse(d.features || "[]"),
        }))
      );
    }
    setLoading(false);
  };

  const handleUpdate = (id: string, field: string, value: any) => {
    setPrices((prev) =>
      prev.map((p) => (p.id === id ? { ...p, [field]: value } : p))
    );
  };

  const handleSave = async (price: PriceRow) => {
    setSaving(price.id);
    const { error } = await supabase
      .from("service_prices")
      .update({
        label: price.label,
        description: price.description,
        price: price.price,
        features: price.features as any,
        is_active: price.is_active,
        display_order: price.display_order,
      })
      .eq("id", price.id);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Price updated!" });
    }
    setSaving(null);
  };

  if (authLoading) return null;
  if (!isAdmin) return <Navigate to="/dashboard" replace />;

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <DollarSign className="h-6 w-6 text-primary" />
          Manage Service Pricing
        </h1>
        <p className="text-muted-foreground text-sm">
          Update prices, descriptions, and features for each service. Changes appear immediately on the landing page.
        </p>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : (
          <div className="space-y-4">
            {prices.map((price) => {
              const Icon = iconMap[price.icon_name];
              return (
                <Card key={price.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base flex items-center gap-2">
                        {Icon && <Icon className="h-5 w-5 text-primary" />}
                        {price.label}
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        <Label htmlFor={`active-${price.id}`} className="text-xs text-muted-foreground">Active</Label>
                        <Switch
                          id={`active-${price.id}`}
                          checked={price.is_active}
                          onCheckedChange={(v) => handleUpdate(price.id, "is_active", v)}
                        />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs">Label</Label>
                        <Input
                          value={price.label}
                          onChange={(e) => handleUpdate(price.id, "label", e.target.value)}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Price ($)</Label>
                        <Input
                          type="number"
                          value={price.price}
                          onChange={(e) => handleUpdate(price.id, "price", parseFloat(e.target.value) || 0)}
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Description</Label>
                      <Textarea
                        value={price.description}
                        onChange={(e) => handleUpdate(price.id, "description", e.target.value)}
                        rows={2}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Features (one per line)</Label>
                      <Textarea
                        value={price.features.join("\n")}
                        onChange={(e) =>
                          handleUpdate(price.id, "features", e.target.value.split("\n").filter(Boolean))
                        }
                        rows={3}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Display Order</Label>
                      <Input
                        type="number"
                        value={price.display_order}
                        onChange={(e) => handleUpdate(price.id, "display_order", parseInt(e.target.value) || 0)}
                        className="w-24"
                      />
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleSave(price)}
                      disabled={saving === price.id}
                    >
                      <Save className="h-4 w-4 mr-1" />
                      {saving === price.id ? "Saving..." : "Save Changes"}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AdminPricing;
