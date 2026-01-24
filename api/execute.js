const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } }
);

module.exports = async (req, res) => {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method Not Allowed" });
    }

    try {
        const body = req.body || {};

        // Campos mínimos esperados desde SFMC (ajusta si tu payload real tiene otros nombres)
        const request_id = body.requestId || body.request_id;
        const contact_key = body.contactKey || body.contact_key;
        const msisdn = body.msisdn;
        const contact_list_id = body.contactListId || body.contact_list_id;
        const campaign_id = body.campaignId || body.campaign_id;
        const journey_id = body.journeyId || body.journey_id;
        const activity_id = body.activityId || body.activity_id;

        // Validación mínima (no inventamos campos)
        if (!request_id || !contact_key || !msisdn || !contact_list_id || !campaign_id || !journey_id || !activity_id) {
        return res.status(400).json({
            error: "Missing required fields",
            required: ["requestId", "contactKey", "msisdn", "contactListId", "campaignId", "journeyId", "activityId"],
        });
        }

        // 1) Crear batch (porque campaign_events.batch_id es NOT NULL)
        const { data: batch, error: batchErr } = await supabase
        .from("campaign_batches")
        .insert([
            {
            channel: "VOICEBOT",
            contact_list_id,
            campaign_id,
            file_name: null,
            row_count: 1,
            status: "CREATED",
            genesys_upload_id: null,
            error_message: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            },
        ])
        .select("batch_id")
        .single();

    if (batchErr) {
        return res.status(500).json({ error: "Failed to create batch", detail: batchErr.message });
    }

    // 2) Insertar evento
    const { data: event, error: eventErr } = await supabase
        .from("campaign_events")
        .insert([
            {
                request_id,
                contact_key,
                msisdn,
                channel: "VOICEBOT",
                contact_list_id,
                campaign_id,
                journey_id,
                activity_id,
                status: "NEW",
                attempt_count: 0,
                error_message: null,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                source: "SFMC",
                status_updated_at: new Date().toISOString(),
                batch_id: batch.batch_id,
            },
        ])
        .select("id, request_id, status, batch_id")
        .single();

    if (eventErr) {
      // Si falla el event, marcamos el batch como ERROR para no dejarlo “colgado”
        await supabase
            .from("campaign_batches")
            .update({
            status: "ERROR",
            error_message: eventErr.message,
            updated_at: new Date().toISOString(),
        })
        .eq("batch_id", batch.batch_id);

        return res.status(500).json({ error: "Failed to insert event", detail: eventErr.message });
    }

    return res.status(200).json({
        ok: true,
        message: "Event accepted",
        batchId: batch.batch_id,
        event,
    });
    } catch (e) {
        return res.status(500).json({ error: "Unexpected error", detail: e.message });
    }
};