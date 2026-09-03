import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Download, Trash2 } from "lucide-react";

type Row = {
  id: string;
  application_id: string;
  user_id: string;
  doc_type: string;
  file_name: string;
  file_path: string;
  created_at: string;
  clientName: string;
};

const AdminDeliverables = () => {
  const { isAdmin, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  const fetchRows = async () => {
    const { data } = await supabase.from("deliverables").select("*").order("created_at", { ascending: false });
    const userIds = [...new Set((data || []).map((d: any) => d.user_id))];
    const { data: profiles } = userIds.length
      ? await supabase.from("profiles").select("user_id, full_name").in("user_id", userIds)
      : { data: [] as any[] };
    const names = new Map((profiles || []).map((p: any) => [p.user_id, p.full_name]));
    setRows((data || []).map((d: any) => ({ ...d, clientName: names.get(d.user_id) || "Unknown client" })));
    setLoading(false);
  };

  useEffect(() => {
    if (!isAdmin) return;
    fetchRows();
  }, [isAdmin]);

  const download = async (row: Row) => {
    const { data, error } = await supabase.storage.from("deliverables").createSignedUrl(row.file_path, 60);
    if (error || !data) {
      toast({ title: "Error", description: error?.message || "Could not open file", variant: "destructive" });
      return;
    }
    window.open(data.signedUrl, "_blank", "noopener");
  };

  const remove = async (row: Row) => {
    await supabase.storage.from("deliverables").remove([row.file_path]);
    const { error } = await supabase.from("deliverables").delete().eq("id", row.id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Deliverable removed" });
    fetchRows();
  };

  if (authLoading) return null;
  if (!isAdmin) return <Navigate to="/dashboard" replace />;

  const filtered = rows.filter((r) => {
    const q = query.trim().toLowerCase();
    return !q || `${r.clientName} ${r.doc_type} ${r.file_name}`.toLowerCase().includes(q);
  });

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-6xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Deliverables</h1>
          <p className="text-sm text-muted-foreground">Every file delivered to clients across all orders.</p>
        </div>

        <Input
          placeholder="Search by client, type or file name..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="max-w-xs"
        />

        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Client</TableHead>
                    <TableHead>Order</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>File</TableHead>
                    <TableHead>Uploaded</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="text-sm">{row.clientName}</TableCell>
                      <TableCell className="font-mono text-xs">#{row.application_id.slice(0, 8)}</TableCell>
                      <TableCell className="text-sm">{row.doc_type}</TableCell>
                      <TableCell className="max-w-[200px] truncate text-sm">{row.file_name}</TableCell>
                      <TableCell className="text-sm">{new Date(row.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => download(row)}>
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => remove(row)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filtered.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">No deliverables yet.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default AdminDeliverables;
