module.exports = (req, res) => {
    if (req.method !== "POST") return res.status(405).json({ error: "Method Not Allowed" });

    console.log("BODY:", JSON.stringify(req.body, null, 2));
    return res.status(200).json({ ok: true, message: "Event accepted" });
};