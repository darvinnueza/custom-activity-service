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
        if (req.method !== "POST") {
            return res.status(405).json({ error: "Method Not Allowed" });
        }

        if (!req.body || Object.keys(req.body).length === 0) {
            return res.status(400).json({ error: "Empty body" });
        }

        const { name, columnNames, phoneColumns } = req.body;

        if (!name || !Array.isArray(columnNames) || !Array.isArray(phoneColumns)) {
            return res.status(400).json({
                error: "Invalid payload",
                required: ["name", "columnNames", "phoneColumns"]
            });
        }

        const baseApi = process.env.GENESYS_BASE_API;
        const token = await getGenesysToken();

        const url = new URL("/api/v2/outbound/contactlists", baseApi);

        const resp = await fetch(url.toString(), {
            method: "POST",
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
                Accept: "application/json",
            },
            body: JSON.stringify({ name, columnNames, phoneColumns }),
        });

        if (!resp.ok) {
            const txt = await resp.text();
            return res.status(resp.status).json({
                error: "Genesys API error",
                details: txt,
            });
        }

        const data = await resp.json();

        return res.status(201).json({
            id: data.id,
            name: data.name
        });

    } catch (e) {
        return res.status(500).json({
            error: "Internal error",
            message: e.message,
        });
    }
};