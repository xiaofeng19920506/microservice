import connectDB from "./config/database";
import createApp from "./config/app";
require("dotenv").config();

const app = createApp();
const PORT = process.env.AUTH_SERVICE_PORT || 12004;

// Connect to MongoDB
connectDB();

// Start server
app.listen(PORT, () => {
  console.log(`🔐 Auth Service running on port ${PORT}`);
  console.log(`📚 API docs: http://localhost:${PORT}/api-docs`);
});

export default app;
