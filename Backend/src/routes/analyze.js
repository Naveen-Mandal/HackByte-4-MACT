import express from "express";
import multer from "multer";
import { analyzeResumePipeline } from "../services/resumeAnalyzer.js";
import { extractResumeData } from "../services/resumeExtractor.js";
import { getDocumentProxy, extractLinks } from "unpdf";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

async function extractHyperlinksFromPdf(pdfBuffer) {
    try {
        const pdf = await getDocumentProxy(new Uint8Array(pdfBuffer));
        const { links } = await extractLinks(pdf);
        return links;
    } catch (err) {
        return [];
    }
}

router.post("/extract", upload.single("resume"), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: "No resume file uploaded." });
        }
        
        const pdfLinks = await extractHyperlinksFromPdf(req.file.buffer);
        const { extractedData, rawText } = await extractResumeData(req.file.buffer, pdfLinks);
        extractedData._pdfHyperlinks = pdfLinks;

        return res.json({
            success: true,
            data: { extractedData, rawText }
        });
    } catch (error) {
        console.error("Error extracting resume:", error);
        return res.status(error.statusCode || 500).json({
            success: false,
            message: "Failed to extract resume.",
            error: error.message
        });
    }
});

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
