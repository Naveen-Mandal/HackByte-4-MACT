import { extractResumeData } from "./resumeExtractor.js";
import { analyzeAtsScore } from "./atsAnalyzer.js";
import { verifyGithubProjects, extractGithubUsername } from "./githubverifyservice.js";
import { analyzeCommitsAndContributors } from "./githubCommitVerifier.js";
import { analyzeSkillDecay } from "./githubSkillDecay.js";
import { generateFinalReview } from "./reviewGenerator.js";
import { verifyCodingProfiles } from "./codingProfilesVerify.js";
import { getDocumentProxy, extractLinks } from "unpdf";

async function extractHyperlinksFromPdf(pdfBuffer) {
    try {
        const pdf = await getDocumentProxy(new Uint8Array(pdfBuffer));
        const { links } = await extractLinks(pdf);
        console.log(`\n====== PDF HYPERLINKS (${links.length}) ======`);
        links.forEach(l => console.log("  ->", l));
        console.log("==========================================\n");
        return links;
    } catch (err) {
        console.warn("Could not extract hyperlinks from PDF:", err.message);
        return [];
    }
}

async function analyzeResumePipeline(pdfBuffer) {
    // 1. Extract Text and Structured JSON from PDF via Gemini
    console.log("Extracting resume data...");
    
    // Extract hyperlinks first (fast, no network calls), then pass to Gemini alongside the text
    const pdfLinks = await extractHyperlinksFromPdf(pdfBuffer);
    
    // Now pass the hyperlinks into extractResumeData so Gemini sees them in ONE prompt
    const extractedDataResult = await extractResumeData(pdfBuffer, pdfLinks);
    const resumeText = extractedDataResult.rawText;
    const extractedData = extractedDataResult.extractedData;

    // Attach hyperlinks to extractedData for downstream use
    extractedData._pdfHyperlinks = pdfLinks;
    
    console.log("\n====== GEMINI EXTRACTED RESUME JSON ======");
    console.log(JSON.stringify(extractedData, null, 2));
    console.log("==========================================\n");

    // 2. ATS Score Calculation
    console.log("Analyzing ATS score...");
    const atsScorePromise = analyzeAtsScore(resumeText);

    // 3. Extract GitHub info — try Gemini extraction first, then fallback to hyperlinks
    let githubUsername = extractGithubUsername(extractedData.githubProfile);
    
    if (!githubUsername && pdfLinks.length > 0) {
        // Search hyperlinks for a github.com URL
        const ghLink = pdfLinks.find(link => /github\.com\/[a-z\d]/i.test(link));
        if (ghLink) {
            const match = ghLink.match(/github\.com\/([a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38})/i);
            if (match) {
                githubUsername = match[1];
                console.log(`GitHub username extracted from PDF hyperlink: ${githubUsername}`);
            }
        }
    }

    let githubAnalytics = {
        profile: null,
        matches: [],
        error: null
    };
    let skillDecayAnalysis = [];

    // 4. Verify Projects & Enhance with Commits/Collaborators
    if (githubUsername) {
        console.log(`Starting GitHub verification for user: ${githubUsername} ...`);
        
        // We utilize the existing githubverifyservice to match projects + run Gemini checks
        // We format extractedData.projects to the expected structure
        let projectsForGithub = [];
        if (Array.isArray(extractedData.projects)) {
             projectsForGithub = extractedData.projects.map(p => ({
                 name: p.name,
                 description: p.description,
                 technologies: p.technologies || [],
                 githubLink: p.githubLink || "",
                 claimedPoints: p.claimedPoints || []
             }));
        }

        try {
             const githubResult = await verifyGithubProjects({
                 username: githubUsername,
                 resumeText: resumeText,
                 resumeProjects: projectsForGithub
             });
             
             githubAnalytics.profile = githubResult.githubProfile || null;
             let parsedGeminiAnalysis = null;
             if (githubResult.geminiAnalysis?.used && githubResult.geminiAnalysis.raw) {
                 try {
                     const rawText = githubResult.geminiAnalysis.raw.replace(/```json\n?|\n?```/g, '').trim();
                     parsedGeminiAnalysis = JSON.parse(rawText);
                 } catch (e) {
                     console.warn("Failed to parse Gemini analysis JSON:", e.message);
                 }
             }

             // Decorate matches with Commit and Collaborator analysis
             if (githubResult.matchedProjects) {
                 for (let match of githubResult.matchedProjects) {
                     const commitAndCollab = await analyzeCommitsAndContributors(githubUsername, match.repo.name);
                     
                     let matchAssessment = null;
                     if (parsedGeminiAnalysis && Array.isArray(parsedGeminiAnalysis.projectAssessments)) {
                         matchAssessment = parsedGeminiAnalysis.projectAssessments.find(
                             a => a.resumeProject === match.resumeProject.name || a.matchedRepo === match.repo.name
                         );
                     }

                     githubAnalytics.matches.push({
                         project: match.resumeProject.name,
                         repo: match.repo.name,
                         matchScore: match.matchScore,
                         deploymentChecked: match.deploymentCheck ? match.deploymentCheck.working : false,
                         commits: commitAndCollab,
                         assessment: matchAssessment || null,
                         codeVerification: githubResult.geminiAnalysis?.used ? "Evaluated (See full payload for details)" : "Disabled"
                     });
                 }
             }

             console.log("Analyzing skill decay...");
             const claimedSkills = Array.isArray(extractedData.skills) ? extractedData.skills : [];
             skillDecayAnalysis = await analyzeSkillDecay(githubUsername, claimedSkills);

        } catch (e) {
            console.error("GitHub verification encountered an issue:", e.message);
            githubAnalytics.error = e.message;
        }
    } else {
        githubAnalytics.error = "No valid GitHub profile found on resume.";
    }

    // 5. Verify Coding Profiles
    console.log("Fetching coding profiles...");
    const codingProfilesInput = extractedData.codingProfiles || {};
    let codingProfilesAnalysis = await verifyCodingProfiles(codingProfilesInput);

    // Synchronize ATS promise
    const atsData = await atsScorePromise;

    // Compile everything into a massive verification object
    const verificationReport = {
        candidate: {
            name: extractedData.contactInfo?.name || "Unknown",
            email: extractedData.contactInfo?.email || "Unknown"
        },
        atsAnalysis: atsData,
        githubAnalytics: githubAnalytics,
        skillDecay: skillDecayAnalysis,
        codingProfilesVerification: codingProfilesAnalysis,
        internships: extractedData.internships || []
    };

    // 6. Final Honest Review
    console.log("Generating final review...");
    const finalReview = await generateFinalReview(verificationReport);
    verificationReport.finalAutomatedReview = finalReview;

    return {
        extractedData,
        verificationReport
    };
}

export { 
    analyzeResumePipeline
 };
