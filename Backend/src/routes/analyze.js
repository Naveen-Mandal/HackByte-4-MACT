import express from "express";
import multer from "multer";
import { analyzeResumePipeline } from "../services/resumeAnalyzer.js";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post("/", upload.single("resume"), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: "No resume file uploaded. Please upload a PDF using the 'resume' field." });
        }

        if (req.file.mimetype !== "application/pdf") {
            return res.status(400).json({ success: false, message: "Only PDF files are supported." });
        }

        const result = await analyzeResumePipeline(req.file.buffer);

        return res.json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error("Error analyzing resume:", error);
        return res.status(error.statusCode || 500).json({
            success: false,
            message: "Failed to analyze resume pipeline.",
            error: error.message
        });
    }
});

export default router;
