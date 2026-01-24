const express = require("express");
const swaggerUi = require("swagger-ui-express");
const YAML = require("yamljs");
const path = require("path");

const app = express();
app.use(express.json({ limit: "2mb" }));

// Carga del contrato OpenAPI
const swaggerPath = path.join(process.cwd(), "swagger.yml");
const swaggerDoc = YAML.load(swaggerPath);

// Swagger UI
app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerDoc));

// Endpoint para descargar el YAML
app.get("/swagger.yml", (req, res) => {
    res.type("text/yaml").sendFile(swaggerPath);
});

// Health check
app.get("/health", (req, res) => res.status(200).json({ status: "UP" }));

// Stub del endpoint principal (SFMC)
app.post("/execute", (req, res) => {
    console.log("BODY:", JSON.stringify(req.body, null, 2));
    res.status(200).json({ ok: true, message: "Event accepted" });
});

// Local dev only
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Running on http://localhost:${PORT}`));

module.exports = app;