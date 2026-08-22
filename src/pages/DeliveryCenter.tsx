import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Download, PackageOpen } from "lucide-react";

const DeliveryCenter = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("deliverables")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setItems(data || []);
        setLoading(false);
      });
  }, [user]);

  const download = async (path: string, name: string) => {
    const { data, error } = await supabase.storage.from("documents").createSignedUrl(path, 60);
    if (error || !data) {
      toast({ title: "Download failed", description: error?.message, variant: "destructive" });
      return;
    }
    const a = document.createElement("a");
    a.href = data.signedUrl;
    a.download = name;
    a.target = "_blank";
    a.click();
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Delivery Center</h1>
          <p className="text-sm text-muted-foreground">All files delivered by our team</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Your deliverables</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading && <p className="text-sm text-muted-foreground">Loading...</p>}
            {!loading && items.length === 0 && (
              <div className="text-center py-8">
                <PackageOpen className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Nothing delivered yet.</p>
              </div>
            )}
            {items.map((d) => (
              <div key={d.id} className="flex flex-wrap items-center gap-3 border rounded-md p-3">
                <div className="flex-1 min-w-[140px]">
                  <p className="text-sm font-medium text-foreground">{d.file_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {d.doc_type} · {new Date(d.created_at).toLocaleDateString()}
                  </p>
                </div>
                <Button size="sm" variant="outline" onClick={() => download(d.file_path, d.file_name)}>
                  <Download className="h-4 w-4 mr-2" /> Download
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default DeliveryCenter;
