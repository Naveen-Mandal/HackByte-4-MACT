import express from "express";
import {
  extractGithubUsername,
  verifyGithubProfile,
  verifyGithubProjects,
} from "../services/githubverifyservice.js";

const router = express.Router();

router.post("/github", async (req, res) => {
  const { username, profileUrl } = req.body ?? {};

  if (!username && !profileUrl) {
    return res.status(400).json({
      success: false,
      message: "Send either username or profileUrl in the request body.",
    });
  }

  const normalizedUsername = extractGithubUsername(username || profileUrl);

  if (!normalizedUsername) {
    return res.status(400).json({
      success: false,
      message: "Provide a valid GitHub username or profile URL.",
    });
  }

  try {
    const result = await verifyGithubProfile(normalizedUsername);

    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;

    return res.status(statusCode).json({
      success: false,
      message: error.message || "Unable to verify GitHub profile.",
    });
  }
});

router.post("/projects", async (req, res) => {
  try {
    const result = await verifyGithubProjects(req.body ?? {});

    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;

    return res.status(statusCode).json({
      success: false,
      message: error.message || "Unable to verify GitHub projects.",
    });
  }
});

export default router;
