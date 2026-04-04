import express from "express";
import { verifyLeetCode } from "../services/leetcodeVerify.js";

const router = express.Router();

router.post("/leetcode", async (req, res) => {
  const leetcodeData = req.body ?? {};

  if (!leetcodeData || !leetcodeData.username) {
    return res.status(400).json({
      success: false,
      message: "Please provide a valid username in the request body.",
    });
  }

  try {
    const verificationResults = await verifyLeetCode(leetcodeData);

    res.json({
      success: true,
      data: verificationResults
    });
  } catch (error) {
    console.error("Error verifying LeetCode profile:", error);
    res.status(500).json({
      success: false,
      message: "An internal server error occurred while verifying LeetCode profile.",
      error: error.message
    });
  }
});

export default router;