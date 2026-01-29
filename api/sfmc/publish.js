module.exports = async (req, res) => {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method Not Allowed" });
    }

    // SFMC publica la activity en el Journey
    return res.status(200).json({ ok: true });
};