import createApp from "./config/app";
import { services } from "./config/proxy";
require("dotenv").config();

const app = createApp();
const PORT = parseInt(process.env.GATEWAY_PORT || "3000");

// Start server
app.listen(PORT, () => {
  console.log(`🚀 API Gateway running on port ${PORT}`);
  console.log(`📋 Available services: ${Object.keys(services).join(", ")}`);
  console.log(`📖 API docs: http://localhost:${PORT}/api`);
  console.log(`📚 Unified Swagger UI: http://localhost:${PORT}/api-docs`);
  console.log(`🌐 Unified API info: http://localhost:${PORT}/unified-api`);
});

export default app;
