import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageSquare, Send, X } from "lucide-react";

interface ChatMessage {
  id: string;
  application_id: string;
  sender_id: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

interface ChatWidgetProps {
  applicationId: string;
  /** If true, shows inline (no floating bubble) */
  inline?: boolean;
}

const ChatWidget = ({ applicationId, inline }: ChatWidgetProps) => {
  const { user, isAdmin } = useAuth();
  const [open, setOpen] = useState(inline ?? false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open || !applicationId) return;
    // Fetch existing messages
    supabase
      .from("chat_messages")
      .select("*")
      .eq("application_id", applicationId)
      .order("created_at", { ascending: true })
      .then(({ data }) => {
        if (data) setMessages(data as ChatMessage[]);
      });

    // Mark unread messages as read
    if (user) {
      supabase
        .from("chat_messages")
        .update({ is_read: true })
        .eq("application_id", applicationId)
        .neq("sender_id", user.id)
        .eq("is_read", false)
        .then(() => {});
    }

    // Subscribe to realtime
    const channel = supabase
      .channel(`chat-${applicationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `application_id=eq.${applicationId}`,
        },
        (payload) => {
          const msg = payload.new as ChatMessage;
          setMessages((prev) => {
            if (prev.some((m) => m.id === msg.id)) return prev;
            return [...prev, msg];
          });
          // Auto-mark as read if it's not from us
          if (user && msg.sender_id !== user.id) {
            supabase
              .from("chat_messages")
              .update({ is_read: true })
              .eq("id", msg.id)
              .then(() => {});
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [open, applicationId, user]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!newMessage.trim() || !user) return;
    setSending(true);
    await supabase.from("chat_messages").insert({
      application_id: applicationId,
      sender_id: user.id,
      message: newMessage.trim(),
    });
    setNewMessage("");
    setSending(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const chatContent = (
    <div className={`flex flex-col ${inline ? "h-80" : "h-96"} bg-background border rounded-lg shadow-lg overflow-hidden`}>
      {!inline && (
        <div className="flex items-center justify-between px-4 py-3 bg-primary text-primary-foreground">
          <span className="font-semibold text-sm flex items-center gap-2">
            <MessageSquare className="h-4 w-4" /> Live Chat
          </span>
          <Button variant="ghost" size="icon" className="h-6 w-6 text-primary-foreground hover:bg-primary/80" onClick={() => setOpen(false)}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
      <ScrollArea className="flex-1 p-3">
        {messages.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            No messages yet. Start the conversation!
          </p>
        ) : (
          <div className="space-y-2">
            {messages.map((msg) => {
              const isMe = msg.sender_id === user?.id;
              return (
                <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[75%] rounded-lg px-3 py-2 text-sm ${isMe ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"}`}>
                    <p className="break-words">{msg.message}</p>
                    <p className={`text-[10px] mt-1 ${isMe ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>
        )}
      </ScrollArea>
      <div className="flex items-center gap-2 p-3 border-t">
        <Input
          placeholder="Type a message..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          className="text-sm"
        />
        <Button size="icon" onClick={handleSend} disabled={sending || !newMessage.trim()}>
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );

  if (inline) return chatContent;

  return (
    <>
      {open && (
        <div className="fixed bottom-20 right-4 w-80 z-50">
          {chatContent}
        </div>
      )}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-4 right-4 z-50 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:bg-primary/90 transition-colors"
        >
          <MessageSquare className="h-6 w-6" />
        </button>
      )}
    </>
  );
};

export default ChatWidget;
