import express from "express";
import { verifyCodechef } from "../services/codechefVerify.js";

const router = express.Router();

router.post("/codechef", async (req, res) => {
  const codechefData = req.body ?? {};

  if (!codechefData || !codechefData.username) {
    return res.status(400).json({
      success: false,
      message: "Please provide a valid username in the request body.",
    });
  }

  try {
    const verificationResults = await verifyCodechef(codechefData);

    res.json({
      success: true,
      data: verificationResults
    });
  } catch (error) {
    console.error("Error verifying CodeChef profile:", error);
    res.status(500).json({
      success: false,
      message: "An internal server error occurred while verifying CodeChef profile.",
      error: error.message
    });
  }
});

export default router;