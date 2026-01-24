module.exports = (req, res) => {
    res.status(200).json({
        ok: true,
        message: "Vercel function is running",
        method: req.method,
        url: req.url
    });
};