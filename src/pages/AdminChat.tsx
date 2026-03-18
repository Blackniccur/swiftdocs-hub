import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import ChatWidget from "@/components/ChatWidget";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Navigate } from "react-router-dom";
import { MessageSquare } from "lucide-react";

interface ChatThread {
  application_id: string;
  client_name: string;
  service_type: string;
  last_message: string;
  last_time: string;
  unread: number;
}

const serviceLabels: Record<string, string> = {
  driving_license: "Driving License",
  outlier_account: "Outlier Account",
  handshake_ai: "Handshake AI",
  mercor_ai: "Mercor AI",
  full_course: "Full Course",
};

const AdminChat = () => {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [selectedApp, setSelectedApp] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAdmin || !user) return;
    fetchThreads();

    const channel = supabase
      .channel("admin-chat-updates")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "chat_messages" },
        () => fetchThreads()
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [isAdmin, user]);

  const fetchThreads = async () => {
    // Get all applications that have chat messages
    const { data: msgs } = await supabase
      .from("chat_messages")
      .select("application_id, message, created_at, sender_id, is_read")
      .order("created_at", { ascending: false });

    if (!msgs || msgs.length === 0) {
      setThreads([]);
      setLoading(false);
      return;
    }

    // Group by application_id
    const appMap = new Map<string, { messages: typeof msgs }>();
    for (const m of msgs) {
      if (!appMap.has(m.application_id)) appMap.set(m.application_id, { messages: [] });
      appMap.get(m.application_id)!.messages.push(m);
    }

    const appIds = [...appMap.keys()];
    const { data: apps } = await supabase
      .from("applications")
      .select("id, service_type, user_id")
      .in("id", appIds);

    const userIds = [...new Set(apps?.map((a) => a.user_id) || [])];
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, full_name")
      .in("user_id", userIds);

    const profileMap = new Map(profiles?.map((p) => [p.user_id, p.full_name]) || []);
    const appInfo = new Map(apps?.map((a) => [a.id, a]) || []);

    const threadList: ChatThread[] = appIds.map((appId) => {
      const data = appMap.get(appId)!;
      const app = appInfo.get(appId);
      const lastMsg = data.messages[0];
      const unread = data.messages.filter((m) => !m.is_read && m.sender_id !== user!.id).length;
      return {
        application_id: appId,
        client_name: profileMap.get(app?.user_id || "") || "Unknown",
        service_type: (app as any)?.service_type || "",
        last_message: lastMsg.message,
        last_time: lastMsg.created_at,
        unread,
      };
    });

    threadList.sort((a, b) => new Date(b.last_time).getTime() - new Date(a.last_time).getTime());
    setThreads(threadList);
    setLoading(false);
  };

  if (authLoading) return null;
  if (!isAdmin) return <Navigate to="/dashboard" replace />;

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold text-foreground mb-6">Live Chat — All Conversations</h1>
        <div className="grid md:grid-cols-3 gap-4">
          {/* Thread list */}
          <div className="space-y-2">
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              </div>
            ) : threads.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No conversations yet.</p>
            ) : (
              threads.map((t) => (
                <Card
                  key={t.application_id}
                  className={`cursor-pointer hover:shadow-md transition-shadow ${selectedApp === t.application_id ? "ring-2 ring-primary" : ""}`}
                  onClick={() => setSelectedApp(t.application_id)}
                >
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-sm text-foreground">{t.client_name}</span>
                      {t.unread > 0 && <Badge className="text-xs">{t.unread}</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground">{serviceLabels[t.service_type] || t.service_type}</p>
                    <p className="text-xs text-muted-foreground truncate mt-1">{t.last_message}</p>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      {new Date(t.last_time).toLocaleString()}
                    </p>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {/* Chat area */}
          <div className="md:col-span-2">
            {selectedApp ? (
              <ChatWidget applicationId={selectedApp} inline />
            ) : (
              <div className="flex flex-col items-center justify-center h-80 text-muted-foreground">
                <MessageSquare className="h-12 w-12 mb-3 opacity-30" />
                <p className="text-sm">Select a conversation to start chatting</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminChat;
