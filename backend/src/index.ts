import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/auth";
dotenv.config();
const app = express();
const port = process.env.PORT || 4000;
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/', (req, res) => {
  res.json({ status: 'ok' });
});
app.use("/api/auth", authRoutes);
// Protected routes
import { authenticate } from "./middleware/auth";
import projectsRoutes from "./routes/projects";
import serversRoutes from "./routes/servers";
import volumesRoutes from "./routes/volumes";
app.use("/api/projects", authenticate, projectsRoutes);
app.use("/api/servers", authenticate, serversRoutes);
app.use("/api/volumes", authenticate, volumesRoutes);
// Bind to all interfaces so WSL can expose it externally
app.listen(port, '0.0.0.0', () => console.log(`Backend running on http://0.0.0.0:${port}`));