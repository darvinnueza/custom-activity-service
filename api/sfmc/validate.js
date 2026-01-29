module.exports = async (req, res) => {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method Not Allowed" });
    }

    // Aquí luego puedes validar campos obligatorios
    return res.status(200).json({ ok: true });
};