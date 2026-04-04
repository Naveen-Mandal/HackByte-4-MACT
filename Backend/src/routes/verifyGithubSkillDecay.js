import express from "express";
import { analyzeSkillDecay } from "../services/githubSkillDecay.js";

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const { username, claimedSkills } = req.body;
    if (!username || !claimedSkills) return res.status(400).json({ error: "username and claimedSkills are required" });

    const result = await analyzeSkillDecay(username, claimedSkills);
    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error verifying skill decay" });
  }
});

export default router;