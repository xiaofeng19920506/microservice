require("dotenv").config();
const express = require("express");
const { createProxyMiddleware } = require("http-proxy-middleware");
const morgan = require("morgan");
const bodyParser = require("body-parser");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;

const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || "http://auth-service:3001";

app.use(morgan("dev"));
app.use(bodyParser.json());
app.use(cors());

app.get("/", (req, res) => {
  res.json({ gateway: "ok" });
});

app.use(
  "/auth",
  createProxyMiddleware({
    target: AUTH_SERVICE_URL,
    changeOrigin: true,
    onProxyReq(proxyReq, req, res) {
      console.log(`[gateway] proxying ${req.method} ${req.originalUrl} -> ${AUTH_SERVICE_URL}${req.originalUrl}`);
    },
    onError(err, req, res) {
      console.error("Proxy error:", err);
      res.status(502).json({ error: "Bad Gateway", details: err.message });
    }
  })
);

app.listen(PORT, () => {
  console.log(`Gateway listening on ${PORT}, proxying /auth -> ${AUTH_SERVICE_URL}`);
});