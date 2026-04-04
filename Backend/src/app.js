import express from "express";
import cors from "cors";
import verifyGithubRouter from "./routes/verifyGithub.js";
import analyzeRouter from "./routes/analyze.js";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({
    success: true,
    message: "GitHub profile verifier is running.",
  });
});

app.use("/api/verify", verifyGithubRouter);
app.use("/api/analyze-resume", analyzeRouter);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found.`,
  });
});

export default app;
