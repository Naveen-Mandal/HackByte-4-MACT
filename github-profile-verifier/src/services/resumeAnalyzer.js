const { extractResumeData } = require("./resumeExtractor");
const { analyzeAtsScore } = require("./atsAnalyzer");
const { verifyGithubProjects, extractGithubUsername } = require("./githubverifyservice");
const { analyzeCommitsAndContributors } = require("./githubCommitVerifier");
const { analyzeSkillDecay } = require("./githubSkillDecay");
const { generateFinalReview } = require("./reviewGenerator");
const { verifyProfiles } = require("./codingProfilesVerify");

async function analyzeResumePipeline(pdfBuffer) {
    // 1. Extra Text and Structured JSON from PDF via Gemini
    console.log("Extracting resume data...");
    const extractedDataResult = await extractResumeData(pdfBuffer);
    const resumeText = extractedDataResult.rawText;
    const extractedData = extractedDataResult.extractedData;

    // 2. ATS Score Calculation
    console.log("Analyzing ATS score...");
    const atsScorePromise = analyzeAtsScore(resumeText);

    // 3. Extract GitHub info
    let githubUsername = extractGithubUsername(extractedData.githubProfile);

    let githubAnalytics = [];
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
                 technologies: p.technologies || []
             }));
        }

        try {
             const githubResult = await verifyGithubProjects({
                 username: githubUsername,
                 resumeText: resumeText,
                 resumeProjects: projectsForGithub
             });
             
             // Decorate matches with Commit and Collaborator analysis
             if (githubResult.matchedProjects) {
                 for (let match of githubResult.matchedProjects) {
                     const commitAndCollab = await analyzeCommitsAndContributors(githubUsername, match.repo.name);
                     githubAnalytics.push({
                         project: match.resumeProject.name,
                         repo: match.repo.name,
                         matchScore: match.matchScore,
                         deploymentChecked: match.deploymentCheck ? match.deploymentCheck.working : false,
                         commits: commitAndCollab,
                         codeVerification: githubResult.geminiAnalysis?.used ? "Evaluated (See full payload for details)" : "Disabled"
                     });
                 }
             }

             console.log("Analyzing skill decay...");
             const claimedSkills = Array.isArray(extractedData.skills) ? extractedData.skills : [];
             skillDecayAnalysis = await analyzeSkillDecay(githubUsername, claimedSkills);

        } catch (e) {
            console.error("GitHub verification encountered an issue:", e.message);
            githubAnalytics = [{ error: e.message }];
        }
    } else {
        githubAnalytics = [{ error: "No valid GitHub profile found on resume." }];
    }

    // 5. Verify Coding Profiles
    console.log("Fetching coding profiles...");
    const codingProfilesInput = extractedData.codingProfiles || {};
    let codingProfilesAnalysis = await verifyProfiles(codingProfilesInput);

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
        codingProfilesVerification: codingProfilesAnalysis
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

module.exports = {
    analyzeResumePipeline
};
