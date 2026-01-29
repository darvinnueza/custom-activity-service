module.exports = async (req, res) => {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method Not Allowed" });
    }

    // SFMC guarda la configuración de la activity
    return res.status(200).json({ ok: true });
};