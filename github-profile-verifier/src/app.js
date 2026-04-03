const express = require("express");
const cors = require("cors");
const verifyGithubRouter = require("./routes/verifyGithub");
const analyzeRouter = require("./routes/analyze");

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

module.exports = app;
