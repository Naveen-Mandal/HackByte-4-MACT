import express from "express";
import cors from "cors";
import verifyGithubRouter from "./routes/verifyGithub.js";
import verifyCodingProfilesRouter from "./routes/verifyCodingProfiles.js";import verifyLeetcodeRouter from "./routes/verifyLeetcode.js";
import verifyCodeforcesRouter from "./routes/verifyCodeforces.js";
import verifyCodechefRouter from "./routes/verifyCodechef.js";import verifyAtsRouter from "./routes/verifyAts.js";
import verifyGithubCommitsRouter from "./routes/verifyGithubCommits.js";
import verifyGithubSkillDecayRouter from "./routes/verifyGithubSkillDecay.js";
import generateReviewRouter from "./routes/generateReview.js";
import analyzeRouter from "./routes/analyze.js";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({
    success: true,
    message: "Verifier backend is running.",
  });
});

app.use("/api/verify", verifyGithubRouter);
app.use("/api/verify", verifyCodingProfilesRouter);
app.use("/api/verify", verifyLeetcodeRouter);
app.use("/api/verify", verifyCodeforcesRouter);
app.use("/api/verify", verifyCodechefRouter);
app.use("/api/verify/ats-score", verifyAtsRouter);
app.use("/api/verify/github-commits", verifyGithubCommitsRouter);
app.use("/api/verify/github-skill-decay", verifyGithubSkillDecayRouter);
app.use("/api/generate-review", generateReviewRouter);
app.use("/api/analyze-resume", analyzeRouter);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found.`,
  });
});

export default app;
