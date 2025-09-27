import createApp from "./config/app";
require("dotenv").config();

const app = createApp();
const PORT = parseInt(process.env.USER_SERVICE_PORT || "3001");

// Start server
app.listen(PORT, () => {
  console.log(`👤 User Service running on port ${PORT}`);
  console.log(`📚 API docs: http://localhost:${PORT}/api-docs`);
});

export default app;
