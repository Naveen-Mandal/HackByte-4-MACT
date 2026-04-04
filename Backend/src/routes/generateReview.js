import express from "express";
import { generateFinalReview } from "../services/reviewGenerator.js";

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const { verificationData } = req.body;
    if (!verificationData) return res.status(400).json({ error: "verificationData is required" });

    const result = await generateFinalReview(verificationData);
    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error generating review" });
  }
});

export default router;