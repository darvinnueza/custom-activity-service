const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } }
);

module.exports = async (req, res) => {
    if (req.method !== "POST") return res.status(405).json({ error: "Method Not Allowed" });

    const body = req.body || {};

    const request_id = body.requestId || body.request_id;
    const contact_key = body.contactKey || body.contact_key;
    const msisdn = body.msisdn;
    const contact_list_id = body.contactListId || body.contact_list_id;
    const campaign_id = body.campaignId || body.campaign_id;
    const journey_id = body.journeyId || body.journey_id;
    const activity_id = body.activityId || body.activity_id;

    if (!request_id || !contact_key || !msisdn || !contact_list_id || !campaign_id || !journey_id || !activity_id) {
        return res.status(400).json({
            error: "Missing required fields",
            required: ["requestId", "contactKey", "msisdn", "contactListId", "campaignId", "journeyId", "activityId"],
        });
    }

    const now = new Date().toISOString();

    const { data, error } = await supabase
        .from("campaign_events")
        .insert([{
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
            created_at: now,
            updated_at: now,
            source: "SFMC",
            status_updated_at: now,
            batch_id: null
        }])
    .select("id, request_id, status")
    .single();

    if (error) return res.status(500).json({ error: "Failed to insert event", detail: error.message });

    return res.status(200).json({ ok: true, message: "Event accepted", event: data });
};