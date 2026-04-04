import express from "express";
import { analyzeAtsScore } from "../services/atsAnalyzer.js";

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const { resumeText } = req.body;
    if (!resumeText) return res.status(400).json({ error: "resumeText is required" });

    const result = await analyzeAtsScore(resumeText);
    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error analyzing ATS" });
  }
});

export default router;
