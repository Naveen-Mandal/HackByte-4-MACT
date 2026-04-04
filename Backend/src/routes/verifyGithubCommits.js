import express from "express";
import { analyzeCommitsAndContributors } from "../services/githubCommitVerifier.js";

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const { owner, repoName } = req.body;
    if (!owner || !repoName) return res.status(400).json({ error: "owner and repoName are required" });

    const result = await analyzeCommitsAndContributors(owner, repoName);
    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error verifying github commits" });
  }
});

export default router;