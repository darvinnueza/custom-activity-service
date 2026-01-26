async function getGenesysToken() {
    const authUrl = process.env.GENESYS_AUTH_URL;
    const clientId = process.env.GENESYS_CLIENT_ID;
    const clientSecret = process.env.GENESYS_CLIENT_SECRET;

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
        throw new Error(`Genesys token error ${resp.status}`);
    }

    const json = await resp.json();
    return json.access_token;
}

module.exports = async (req, res) => {
    try {
         // ✅ PASO 3 REAL (aquí y solo aquí)
        const auth = req.headers.authorization;
        if (!auth || auth !== `Bearer ${process.env.INTERNAL_API_TOKEN}`) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        // 🔒 SOLO GET
        if (req.method !== "GET") {
            return res.status(405).json({ error: "Method Not Allowed" });
        }

        const { divisionId } = req.query;
        if (!divisionId) {
            return res.status(400).json({
                error: "Missing query param: divisionId"
            });
        }

        const baseApi = process.env.GENESYS_BASE_API;
        const token = await getGenesysToken();

        const url = new URL("/api/v2/outbound/campaigns", baseApi);
        url.searchParams.set("divisionId", divisionId);

        const resp = await fetch(url.toString(), {
            headers: {
                Authorization: `Bearer ${token}`,
                Accept: "application/json",
            },
        });

        if (!resp.ok) {
            const txt = await resp.text();
            return res.status(resp.status).json({
                error: "Genesys API error",
                details: txt,
            });
        }

        const data = await resp.json();

        // 🎯 RESPUESTA LIMPIA
        const result = (data.entities || []).map(c => ({
            id: c.id,
            name: c.name,
            divisionId
        }));

        return res.status(200).json({
            entities: result
        });

    } catch (e) {
        return res.status(500).json({
            error: "Internal error",
            message: e.message,
        });
    }
};