module.exports = function checkAuth(req, res) {
    const auth = req.headers.authorization;

    if (!auth || !auth.startsWith("Bearer ")) {
        res.status(401).json({ error: "Missing Authorization header" });
        return false;
    }

    const token = auth.replace("Bearer ", "");

    if (token !== process.env.INTERNAL_API_TOKEN) {
        res.status(403).json({ error: "Invalid token" });
        return false;
    }

    return true;
};