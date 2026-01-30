async function getGenesysToken() {
    const authUrl = process.env.GENESYS_AUTH_URL;
    const clientId = process.env.GENESYS_CLIENT_ID;
    const clientSecret = process.env.GENESYS_CLIENT_SECRET;

    if (!authUrl || !clientId || !clientSecret) {
        throw new Error("Missing Genesys env vars (GENESYS_AUTH_URL/CLIENT_ID/CLIENT_SECRET)");
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
        const txt = await resp.text().catch(() => "");
        throw new Error(`Genesys token error ${resp.status} ${txt || ""}`.trim());
    }

    const json = await resp.json();
    if (!json?.access_token) {
        throw new Error("Genesys token response missing access_token");
    }

    return json.access_token;
}

module.exports = async (req, res) => {
    try {
        // =========================
        // 🔐 AUTH INTERNA
        // =========================
        const auth = req.headers.authorization;
        const expected = process.env.INTERNAL_TOKEN || process.env.INTERNAL_API_TOKEN;

        if (!expected) {
            return res.status(500).json({
                error: "Internal error",
                message: "Missing INTERNAL_TOKEN / INTERNAL_API_TOKEN in env",
            });
        }

        if (!auth || auth !== `Bearer ${expected}`) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        const baseApi = process.env.GENESYS_BASE_API;
        if (!baseApi) {
            return res.status(500).json({
                error: "Internal error",
                message: "Missing GENESYS_BASE_API in env",
            });
        }

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

            const raw = await resp.text().catch(() => "");

            if (!resp.ok) {
                return res.status(resp.status).json({
                    error: "Genesys API error",
                    details: raw,
                });
            }

            let data = {};
            try {
                data = raw ? JSON.parse(raw) : {};
            } catch {
                data = {};
            }

            const result = (data.entities || []).map((cl) => ({
                id: cl.id,
                name: cl.name,
                divisionId, // consistente con tu contrato local
            }));

            // ✅ Swagger: ContactListResponse.entities
            return res.status(200).json({ entities: result });
        }

        // =========================
        // POST /contactlists
        // =========================
        if (req.method === "POST") {
            const body = req.body || {};

            // ✅ Normaliza el body al contrato Swagger (incluye division.id)
            const payload = {
                name: body.name,
                columnNames: Array.isArray(body.columnNames) ? body.columnNames : [],
                phoneColumns: Array.isArray(body.phoneColumns) ? body.phoneColumns : [],
                division: body?.division?.id ? { id: body.division.id } : undefined,
            };

            // Validaciones mínimas
            if (!payload.name) {
                return res.status(400).json({ error: "Missing field: name" });
            }
            if (!payload.columnNames.length) {
                return res.status(400).json({ error: "Missing field: columnNames" });
            }
            if (!payload.phoneColumns.length) {
                return res.status(400).json({ error: "Missing field: phoneColumns" });
            }
            if (!payload.division?.id) {
                return res.status(400).json({ error: "Missing field: division.id" });
            }

            // Log seguro (sin tokens)
            console.log("[createContactList] payload=", {
                name: payload.name,
                columnNamesCount: payload.columnNames.length,
                phoneColumns: payload.phoneColumns,
                divisionId: payload.division.id,
            });

            const resp = await fetch(`${baseApi}/api/v2/outbound/contactlists`, {
                method: "POST",
                headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
                Accept: "application/json",
                },
                body: JSON.stringify(payload),
            });

            const raw = await resp.text().catch(() => "");

            if (!resp.ok) {
                return res.status(resp.status).json({
                    error: "Genesys API error",
                    details: raw,
                });
            }

            let data = {};
            try {
                data = raw ? JSON.parse(raw) : {};
            } catch {
                data = {};
            }

            // ✅ Swagger: ContactList (response local)
            return res.status(201).json({
                    id: data.id,
                    name: data.name,
                    divisionId: data?.division?.id || payload.division.id,
                });
            }

            // =========================
            // METHOD NOT ALLOWED
            // =========================
            return res.status(405).json({ error: "Method Not Allowed" });
    } catch (e) {
        console.error("[contactlists] ERROR:", e);
        return res.status(500).json({
            error: "Internal error",
            message: e?.message || String(e),
        });
    }
};