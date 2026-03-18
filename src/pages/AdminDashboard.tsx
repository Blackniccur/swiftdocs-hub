import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Eye, FileText, Upload } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";
import { Navigate } from "react-router-dom";

type AppWithProfile = Tables<"applications"> & { profiles?: { full_name: string; phone: string | null } | null };

const statusLabels: Record<string, string> = {
  submitted: "Order Placed",
  documents_review: "Under Review",
  processing: "Processing",
  ready: "Ready",
  rejected: "Rejected",
};

const serviceLabels: Record<string, string> = {
  driving_license: "Driving License",
  outlier_account: "Outlier Account",
  handshake_ai: "Handshake AI",
  mercor_ai: "Mercor AI",
  full_course: "Freelancing AI Course",
};

const deliverableTypes = [
  { value: "w2_form", label: "W2 Form" },
  { value: "driving_license", label: "Driving License" },
  { value: "outlier_account", label: "Outlier Account Credentials" },
  { value: "handshake_ai_account", label: "Handshake AI Account Credentials" },
];

const AdminDashboard = () => {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [applications, setApplications] = useState<AppWithProfile[]>([]);
  const [documents, setDocuments] = useState<Tables<"documents">[]>([]);
  const [deliverables, setDeliverables] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState<AppWithProfile | null>(null);
  const [newStatus, setNewStatus] = useState("");
  const [adminNotes, setAdminNotes] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Deliverable upload state
  const [deliverableType, setDeliverableType] = useState("");
  const [deliverableFile, setDeliverableFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!isAdmin) return;
    fetchData();
  }, [isAdmin]);

  const fetchData = async () => {
    const { data: rawApps } = await supabase
      .from("applications")
      .select("*")
      .order("created_at", { ascending: false });

    if (rawApps) {
      const userIds = [...new Set(rawApps.map((a) => a.user_id))];
      const { data: profiles } = await supabase.from("profiles").select("user_id, full_name, phone").in("user_id", userIds);
      const profileMap = new Map(profiles?.map((p) => [p.user_id, p]) || []);
      setApplications(rawApps.map((a) => ({ ...a, profiles: profileMap.get(a.user_id) || null })));
    }
    setLoading(false);
  };

  const handleViewApp = async (app: AppWithProfile) => {
    setSelectedApp(app);
    setNewStatus(app.status);
    setAdminNotes(app.admin_notes || "");
    setDeliverableType("");
    setDeliverableFile(null);
    const [docsRes, delRes] = await Promise.all([
      supabase.from("documents").select("*").eq("application_id", app.id),
      supabase.from("deliverables").select("*").eq("application_id", app.id),
    ]);
    setDocuments(docsRes.data || []);
    setDeliverables(delRes.data || []);
  };

  const handleUpdateStatus = async () => {
    if (!selectedApp) return;
    const { error } = await supabase
      .from("applications")
      .update({ status: newStatus as any, admin_notes: adminNotes })
      .eq("id", selectedApp.id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Updated!" });
      fetchData();
    }
  };

  const handleUploadDeliverable = async () => {
    if (!selectedApp || !user || !deliverableFile || !deliverableType) return;
    setUploading(true);
    try {
      const ext = deliverableFile.name.split(".").pop();
      const filePath = `${selectedApp.user_id}/${selectedApp.id}/${deliverableType}_${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from("deliverables").upload(filePath, deliverableFile);
      if (uploadError) throw uploadError;

      const { error } = await supabase.from("deliverables").insert({
        application_id: selectedApp.id,
        user_id: selectedApp.user_id,
        doc_type: deliverableType,
        file_path: filePath,
        file_name: deliverableFile.name,
        uploaded_by: user.id,
      });
      if (error) throw error;

      toast({ title: "Deliverable uploaded!" });
      setDeliverableFile(null);
      setDeliverableType("");
      handleViewApp(selectedApp);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const handleDocAction = async (docId: string, action: "approved" | "rejected", reason?: string) => {
    const update: any = { status: action };
    if (reason) update.rejection_reason = reason;
    await supabase.from("documents").update(update).eq("id", docId);
    if (selectedApp) handleViewApp(selectedApp);
    toast({ title: `Document ${action}` });
  };

  if (authLoading) return null;
  if (!isAdmin) return <Navigate to="/dashboard" replace />;

  const filtered = applications.filter((a) => {
    if (filterStatus !== "all" && a.status !== filterStatus) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return a.id.toLowerCase().includes(q) || (a.profiles?.full_name || "").toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-foreground">Admin — All Orders</h1>

        <div className="flex flex-col sm:flex-row gap-3">
          <Input placeholder="Search by name or ID..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="max-w-xs" />
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="submitted">Order Placed</SelectItem>
              <SelectItem value="documents_review">Under Review</SelectItem>
              <SelectItem value="processing">Processing</SelectItem>
              <SelectItem value="ready">Ready</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Service</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((app) => (
                    <TableRow key={app.id}>
                      <TableCell className="font-mono text-xs">{app.id.slice(0, 8)}</TableCell>
                      <TableCell>{app.profiles?.full_name || "—"}</TableCell>
                      <TableCell className="text-sm">{serviceLabels[(app as any).service_type] || "—"}</TableCell>
                      <TableCell>
                        <Badge variant={app.status === "ready" ? "default" : app.status === "rejected" ? "destructive" : "secondary"}>
                          {statusLabels[app.status]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">{new Date(app.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm" onClick={() => handleViewApp(app)}>
                              <Eye className="h-4 w-4 mr-1" />
                              Manage
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>
                                Order #{app.id.slice(0, 8)} — {app.profiles?.full_name || "Unknown"}
                              </DialogTitle>
                            </DialogHeader>
                            <div className="space-y-5">
                              {/* Client documents */}
                              <div>
                                <h4 className="font-medium text-sm text-foreground mb-2">Client Documents</h4>
                                {documents.length === 0 ? (
                                  <p className="text-sm text-muted-foreground">No documents uploaded.</p>
                                ) : documents.map((doc) => (
                                  <div key={doc.id} className="border rounded-md p-3 mb-2 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <FileText className="h-4 w-4 text-muted-foreground" />
                                      <div>
                                        <p className="text-sm font-medium">{doc.doc_type}</p>
                                        <p className="text-xs text-muted-foreground">{doc.file_name}</p>
                                      </div>
                                    </div>
                                    <div className="flex gap-1">
                                      {doc.status === "pending" ? (
                                        <>
                                          <Button size="sm" variant="outline" onClick={() => handleDocAction(doc.id, "approved")}>Approve</Button>
                                          <Button size="sm" variant="destructive" onClick={() => handleDocAction(doc.id, "rejected", "Document unclear")}>Reject</Button>
                                        </>
                                      ) : (
                                        <Badge variant={doc.status === "approved" ? "default" : "destructive"}>{doc.status}</Badge>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>

                              {/* Upload deliverables */}
                              <div className="border-t pt-4">
                                <h4 className="font-medium text-sm text-foreground mb-2 flex items-center gap-2">
                                  <Upload className="h-4 w-4 text-primary" />
                                  Upload Deliverable
                                </h4>
                                <div className="space-y-3">
                                  <Select value={deliverableType} onValueChange={setDeliverableType}>
                                    <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                                    <SelectContent>
                                      {deliverableTypes.map((d) => (
                                        <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <Input type="file" accept="image/*,.pdf,.txt,.doc,.docx" onChange={(e) => setDeliverableFile(e.target.files?.[0] || null)} />
                                  <Button size="sm" onClick={handleUploadDeliverable} disabled={uploading || !deliverableType || !deliverableFile}>
                                    {uploading ? "Uploading..." : "Upload"}
                                  </Button>
                                </div>

                                {deliverables.length > 0 && (
                                  <div className="mt-3 space-y-2">
                                    <p className="text-xs text-muted-foreground font-medium">Uploaded Deliverables:</p>
                                    {deliverables.map((d: any) => (
                                      <div key={d.id} className="text-sm flex items-center gap-2 border rounded-md p-2">
                                        <FileText className="h-4 w-4 text-primary" />
                                        <span>{d.doc_type} — {d.file_name}</span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>

                              {/* Update status */}
                              <div className="space-y-3 border-t pt-4">
                                <h4 className="font-medium text-sm text-foreground">Update Status</h4>
                                <Select value={newStatus} onValueChange={setNewStatus}>
                                  <SelectTrigger><SelectValue /></SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="submitted">Order Placed</SelectItem>
                                    <SelectItem value="documents_review">Under Review</SelectItem>
                                    <SelectItem value="processing">Processing</SelectItem>
                                    <SelectItem value="ready">Ready</SelectItem>
                                    <SelectItem value="rejected">Rejected</SelectItem>
                                  </SelectContent>
                                </Select>
                                <Textarea placeholder="Admin notes" value={adminNotes} onChange={(e) => setAdminNotes(e.target.value)} />
                                <Button onClick={handleUpdateStatus}>Update</Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filtered.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No orders found.</TableCell>
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

export default AdminDashboard;
