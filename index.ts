const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const CONTACT_NOTIFICATION_EMAIL = Deno.env.get("CONTACT_NOTIFICATION_EMAIL");
const RESEND_FROM_EMAIL = Deno.env.get("RESEND_FROM_EMAIL") || "ADELUUVE <onboarding@resend.dev>";
const SEND_CLIENT_CONFIRMATION = Deno.env.get("SEND_CLIENT_CONFIRMATION") === "true";

function escapeHtml(value: unknown) {
  return String(value ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  }[c] || c));
}

async function sendEmail(body: Record<string, unknown>) {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });
  const result = await response.json();
  if (!response.ok) throw new Error(`Resend ${response.status}: ${JSON.stringify(result)}`);
  return result;
}

Deno.serve(async (req) => {
  try {
    if (!RESEND_API_KEY || !CONTACT_NOTIFICATION_EMAIL) {
      throw new Error("Faltan RESEND_API_KEY o CONTACT_NOTIFICATION_EMAIL en Edge Function Secrets.");
    }

    const payload = await req.json();
    const c = payload.record;
    if (!c) return Response.json({ error: "No se recibió record" }, { status: 400 });

    const nombre = escapeHtml(c.nombre || "Cliente");
    const empresa = escapeHtml(c.empresa || "-");
    const correo = escapeHtml(c.correo || "-");
    const telefono = escapeHtml(c.telefono || "-");
    const servicio = escapeHtml(c.servicio || "-");
    const mensaje = escapeHtml(c.mensaje || "-");
    const folio = escapeHtml(c.id || "-");

    await sendEmail({
      from: RESEND_FROM_EMAIL,
      to: [CONTACT_NOTIFICATION_EMAIL],
      reply_to: c.correo || undefined,
      subject: `Nueva solicitud ADELUUVE | ${c.nombre || "Cliente"}`,
      html: `<div style="font-family:Arial,sans-serif;max-width:680px;margin:auto;border:1px solid #dce8ed;border-radius:18px;overflow:hidden;background:#fff">
        <div style="background:#063f5c;color:#fff;padding:28px"><div style="font-size:12px;opacity:.7">ADELUUVE</div><h1 style="margin:6px 0 0;font-size:26px">Nueva solicitud</h1></div>
        <div style="padding:28px">
          <div style="display:inline-block;padding:7px 11px;background:#eef8fb;border-radius:999px;font-size:12px;font-weight:bold">Folio ${folio}</div>
          <table style="width:100%;border-collapse:collapse;margin-top:18px;font-size:14px">
            <tr><td style="padding:9px 0;font-weight:bold;width:145px">Nombre</td><td>${nombre}</td></tr>
            <tr><td style="padding:9px 0;font-weight:bold">Empresa</td><td>${empresa}</td></tr>
            <tr><td style="padding:9px 0;font-weight:bold">Correo</td><td>${correo}</td></tr>
            <tr><td style="padding:9px 0;font-weight:bold">Teléfono</td><td>${telefono}</td></tr>
            <tr><td style="padding:9px 0;font-weight:bold">Servicio</td><td>${servicio}</td></tr>
          </table>
          <div style="margin-top:20px;padding:18px;background:#f6fafc;border-radius:14px"><b>¿Qué necesita resolver?</b><p style="white-space:pre-wrap;line-height:1.55">${mensaje}</p></div>
        </div>
      </div>`
    });

    // Solo se envía si tú lo activas expresamente y el remitente de Resend ya puede enviar a terceros.
    if (SEND_CLIENT_CONFIRMATION && c.correo) {
      await sendEmail({
        from: RESEND_FROM_EMAIL,
        to: [c.correo],
        subject: `ADELUUVE | Solicitud recibida${c.id ? ` · Folio ${c.id}` : ""}`,
        html: `<div style="font-family:Arial,sans-serif;max-width:620px;margin:auto;padding:28px"><h2 style="color:#063f5c">ADELUUVE</h2><p>Hemos recibido tu solicitud.</p>${c.id ? `<p><b>Folio:</b> ${folio}</p>` : ""}</div>`
      });
    }

    return Response.json({ ok: true });
  } catch (error) {
    console.error(error);
    return Response.json({ error: error instanceof Error ? error.message : "Error desconocido" }, { status: 500 });
  }
});
