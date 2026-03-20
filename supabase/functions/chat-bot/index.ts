import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const { message, application_id, user_id } = await req.json();
    if (!message || !application_id || !user_id)
      throw new Error("Missing required fields");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get application context
    const { data: app } = await supabase
      .from("applications")
      .select("service_type, status, admin_notes, estimated_completion")
      .eq("id", application_id)
      .single();

    // Get recent chat history
    const { data: history } = await supabase
      .from("chat_messages")
      .select("sender_id, message, created_at")
      .eq("application_id", application_id)
      .order("created_at", { ascending: false })
      .limit(10);

    const chatHistory = (history || []).reverse().map((m) => ({
      role: m.sender_id === user_id ? "user" : "assistant",
      content: m.message,
    }));

    // Get service label
    const { data: svcPrice } = await supabase
      .from("service_prices")
      .select("label, price")
      .eq("service_key", app?.service_type || "")
      .single();

    const statusLabels: Record<string, string> = {
      submitted: "Order Placed",
      documents_review: "Under Review",
      processing: "Processing",
      ready: "Ready",
      rejected: "Rejected",
    };

    const systemPrompt = `You are Melissa, a friendly and professional support assistant for AccelDocs. You help clients with their orders.

Current order context:
- Service: ${svcPrice?.label || app?.service_type || "Unknown"}
- Status: ${statusLabels[app?.status || ""] || app?.status || "Unknown"}
- Estimated completion: ${app?.estimated_completion || "Not set yet"}
${app?.admin_notes ? `- Admin notes: ${app.admin_notes}` : ""}

Guidelines:
- Be helpful, friendly, and concise.
- Answer questions about order status, timelines, and general service info.
- If the client asks something you cannot answer (refunds, technical issues, account changes), tell them: "Let me connect you with our team. An admin will respond shortly."
- When you say that, set needs_admin to true in your response.
- Never make up information about delivery dates or statuses.
- Keep responses short (2-3 sentences max).`;

    const aiMessages = [
      { role: "system", content: systemPrompt },
      ...chatHistory,
      { role: "user", content: message },
    ];

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash-lite",
          messages: aiMessages,
          tools: [
            {
              type: "function",
              function: {
                name: "respond_to_client",
                description: "Respond to the client's message",
                parameters: {
                  type: "object",
                  properties: {
                    reply: { type: "string", description: "The reply message" },
                    needs_admin: {
                      type: "boolean",
                      description:
                        "Whether this needs admin attention",
                    },
                  },
                  required: ["reply", "needs_admin"],
                  additionalProperties: false,
                },
              },
            },
          ],
          tool_choice: {
            type: "function",
            function: { name: "respond_to_client" },
          },
        }),
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limited, please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw new Error(`AI error: ${response.status}`);
    }

    const aiData = await response.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    let reply = "I'm sorry, I couldn't process that. An admin will get back to you shortly.";
    let needsAdmin = true;

    if (toolCall?.function?.arguments) {
      try {
        const args = JSON.parse(toolCall.function.arguments);
        reply = args.reply || reply;
        needsAdmin = args.needs_admin ?? true;
      } catch {
        // Use defaults
      }
    }

    // Save bot reply as a chat message (using a special "bot" sender concept - we'll use a fixed UUID)
    const BOT_SENDER_ID = "00000000-0000-0000-0000-000000000000";
    await supabase.from("chat_messages").insert({
      application_id,
      sender_id: BOT_SENDER_ID,
      message: reply,
      is_read: false,
    });

    return new Response(
      JSON.stringify({ reply, needs_admin: needsAdmin }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("chat-bot error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
