import express from "express";
import { verifyCodeforces } from "../services/codeforcesVerify.js";

const router = express.Router();

router.post("/codeforces", async (req, res) => {
  const codeforcesData = req.body ?? {};

  if (!codeforcesData || !codeforcesData.username) {
    return res.status(400).json({
      success: false,
      message: "Please provide a valid username in the request body.",
    });
  }

  try {
    const verificationResults = await verifyCodeforces(codeforcesData);

    res.json({
      success: true,
      data: verificationResults
    });
  } catch (error) {
    console.error("Error verifying Codeforces profile:", error);
    res.status(500).json({
      success: false,
      message: "An internal server error occurred while verifying Codeforces profile.",
      error: error.message
    });
  }
});

export default router;