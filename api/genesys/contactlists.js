async function getGenesysToken() {
    const authUrl = process.env.GENESYS_AUTH_URL;
    const clientId = process.env.GENESYS_CLIENT_ID;
    const clientSecret = process.env.GENESYS_CLIENT_SECRET;

    if (!authUrl || !clientId || !clientSecret) {
        throw new Error("Missing env vars: GENESYS_AUTH_URL, GENESYS_CLIENT_ID, GENESYS_CLIENT_SECRET");
    }

    const basic = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

    const resp = await fetch(authUrl, {
        method: "POST",
        headers: {
            Authorization: `Basic ${basic}`,
            "Content-Type": "application/x-www-form-urlencoded",
        },
        body: "grant_type=client_credentials",
    });

    if (!resp.ok) {
        const details = await resp.text();
        throw new Error(`Genesys token error ${resp.status}: ${details}`);
    }

    const json = await resp.json();
    if (!json.access_token) throw new Error("Genesys token response missing access_token");

    return json.access_token;
}

module.exports = async (req, res) => {
    try {
        if (req.method !== "GET") return res.status(405).json({ error: "Method Not Allowed" });

        const { divisionId } = req.query;
        if (!divisionId) return res.status(400).json({ error: "Missing query param: divisionId" });

        const baseApi = process.env.GENESYS_BASE_API; // {{base_api}}
        if (!baseApi) return res.status(500).json({ error: "Missing env var: GENESYS_BASE_API" });

        const token = await getGenesysToken();

        const url = new URL("/api/v2/outbound/contactlists", baseApi);
        url.searchParams.set("divisionId", divisionId);

        const resp = await fetch(url.toString(), {
        method: "GET",
        headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
        },
    });

    const bodyText = await resp.text();

    if (!resp.ok) {
        return res.status(resp.status).json({
            error: "Genesys API error",
            status: resp.status,
            details: bodyText,
        });
    }

        res.setHeader("Content-Type", "application/json");
        return res.status(200).send(bodyText);
    } catch (e) {
        return res.status(500).json({ error: "Internal error", message: e.message });
    }
};