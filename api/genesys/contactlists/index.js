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
        // =========================
        // 🔐 AUTH INTERNA (PASO 3)
        // =========================
        const auth = req.headers.authorization;
        if (
            !auth ||
            auth !== `Bearer ${process.env.INTERNAL_API_TOKEN}`
        ) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        const baseApi = process.env.GENESYS_BASE_API;
        const token = await getGenesysToken();

        // =========================
        // GET /contactlists
        // =========================
        if (req.method === "GET") {
            const { divisionId } = req.query;

            if (!divisionId) {
                return res.status(400).json({
                    error: "Missing query param: divisionId",
                });
            }

            const url = new URL("/api/v2/outbound/contactlists", baseApi);
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

            const result = (data.entities || []).map(cl => ({
                id: cl.id,
                name: cl.name,
                divisionId,
            }));

            return res.status(200).json(result);
        }

        // =========================
        // POST /contactlists
        // =========================
        if (req.method === "POST") {
            const resp = await fetch(
                `${baseApi}/api/v2/outbound/contactlists`,
                {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                        Accept: "application/json",
                    },
                    body: JSON.stringify(req.body),
                }
            );

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
                name: data.name,
            });
        }

        // =========================
        // METHOD NOT ALLOWED
        // =========================
        return res.status(405).json({ error: "Method Not Allowed" });

    } catch (e) {
        return res.status(500).json({
            error: "Internal error",
            message: e.message,
        });
    }
};