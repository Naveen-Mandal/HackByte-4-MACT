import express from "express";
import { verifyCodingProfiles } from "../services/codingProfilesVerify.js";

const router = express.Router();

router.post("/coding-profiles", async (req, res) => {
  const { codingProfiles } = req.body ?? {};

  if (!codingProfiles || typeof codingProfiles !== "object") {
    return res.status(400).json({
      success: false,
      message: "Please provide a valid codingProfiles object in the request body.",
    });
  }

  try {
    const verificationResults = await verifyCodingProfiles(codingProfiles);
    
    res.json({
      success: true,
      data: verificationResults
    });
  } catch (error) {
    console.error("Error verifying coding profiles:", error);
    res.status(500).json({
      success: false,
      message: "An internal server error occurred while verifying coding profiles.",
      error: error.message
    });
  }
});

export default router;
