module.exports = async (req, res) => {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method Not Allowed" });
    }

    const body = req.body || {};
    const inArgs = Array.isArray(body.inArguments) ? body.inArguments[0] : body;

    const request_id = inArgs.requestId;
    const contact_key = inArgs.contactKey;
    const msisdn = inArgs.msisdn;
    const contact_list_id = inArgs.contactListId;
    const campaign_id = inArgs.campaignId;
    const journey_id = body.journeyId;
    const activity_id = body.activityId;

    if (!request_id || !contact_key || !msisdn || !contact_list_id || !campaign_id || !journey_id || !activity_id) {
      return res.status(400).json({ error: "Missing required fields" });
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
        created_at: now,
        updated_at: now
      }])
      .select("id, request_id, status")
      .limit(1);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({
      ok: true,
      message: "Event accepted",
      event: data[0]
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
};