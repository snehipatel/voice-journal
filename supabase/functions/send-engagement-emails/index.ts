import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) {
      return new Response(JSON.stringify({ error: "RESEND_API_KEY not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { receiverId, senderName, emoji, message } = await req.json();

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check if user has email notifications enabled
    const { data: privacy } = await supabase
      .from("privacy_settings")
      .select("email_notifications")
      .eq("user_id", receiverId)
      .maybeSingle();

    if (privacy && privacy.email_notifications === false) {
      return new Response(JSON.stringify({ ok: true, skipped: "email_notifications_off" }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: receiver } = await supabase
      .from("profiles")
      .select("email, display_name")
      .eq("user_id", receiverId)
      .maybeSingle();

    if (!receiver?.email) {
      return new Response(JSON.stringify({ error: "No email" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const receiverName = receiver.display_name || "there";
    const ctaUrl = "https://id-preview--6e97a899-942f-4045-b5ef-cd3305537448.lovable.app";

    const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#faf7f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:520px;margin:0 auto;padding:32px 24px;">
    <div style="text-align:center;margin-bottom:24px;">
      <div style="display:inline-block;background:#fff7ed;border-radius:16px;padding:12px 16px;">
        <span style="font-size:24px;">🧑‍🎓</span>
        <span style="font-size:16px;font-weight:700;color:#ea580c;margin-left:8px;">Sakhi</span>
      </div>
    </div>
    <div style="background:white;border-radius:16px;padding:32px 28px;box-shadow:0 1px 3px rgba(0,0,0,0.06);">
      <p style="font-size:18px;font-weight:600;color:#1a1a1a;margin:0 0 16px;">Hi ${receiverName},</p>
      <p style="font-size:15px;color:#4a4a4a;line-height:1.7;margin:0 0 20px;">
        ${senderName} ${message} ${emoji}
      </p>
      <p style="font-size:14px;color:#666;line-height:1.6;margin:0 0 24px;">
        Keep going — your consistency is inspiring.
      </p>
      <div style="text-align:center;">
        <a href="${ctaUrl}" style="display:inline-block;background:#ea580c;color:white;text-decoration:none;padding:14px 32px;border-radius:12px;font-weight:600;font-size:15px;">
          Open the app ✨
        </a>
      </div>
    </div>
    <p style="text-align:center;font-size:12px;color:#999;margin-top:24px;">
      Sakhi · You received this because someone encouraged your progress.
    </p>
  </div>
</body>
</html>`;

    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Sakhi <onboarding@resend.dev>",
        to: [receiver.email],
        subject: `Someone encouraged your progress ${emoji}`,
        html,
      }),
    });

    return new Response(JSON.stringify({ ok: true }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
