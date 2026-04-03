const { verifyLeetCode } = require('./leetCodeVerify');
const { verifyCodeforces } = require('./codeforcesVerify');
const { verifyCodechef } = require('./codechefVerify');

function normalizeClaim(claim) {
    if (!claim) return null;
    
    // If the claim is just the username string
    if (typeof claim === 'string') {
        return { username: claim };
    }
    
    if (typeof claim === 'object') {
        if (!claim.username) return null; // We absolutely need a username
        
        // Remove empty or null claims to prevent matching errors during verification
        const sanitized = {};
        for (const [key, value] of Object.entries(claim)) {
            if (value !== null && value !== undefined && value !== "") {
                sanitized[key] = value;
            }
        }
        return sanitized;
    }
    return null;
}

async function verifyCodingProfiles(codingProfilesClaims) {
    if (!codingProfilesClaims || typeof codingProfilesClaims !== 'object') {
        return { verified: true, message: "No coding profiles provided", results: {} };
    }

    const results = {};
    let allVerified = true;

    // Verify LeetCode if provided
    const leetcodeClaim = normalizeClaim(codingProfilesClaims.leetcode);
    if (leetcodeClaim) {
        results.leetcode = await verifyLeetCode(leetcodeClaim);
        if (results.leetcode.error || (results.leetcode.mismatches && results.leetcode.mismatches.length > 0)) {
            allVerified = false;
        }
    }

    // Verify Codeforces if provided
    const codeforcesClaim = normalizeClaim(codingProfilesClaims.codeforces);
    if (codeforcesClaim) {
        results.codeforces = await verifyCodeforces(codeforcesClaim);
        if (results.codeforces.error || (results.codeforces.mismatches && results.codeforces.mismatches.length > 0)) {
            allVerified = false;
        }
    }

    // Verify CodeChef if provided
    const codechefClaim = normalizeClaim(codingProfilesClaims.codechef);
    if (codechefClaim) {
        results.codechef = await verifyCodechef(codechefClaim);
        if (results.codechef.error || (results.codechef.mismatches && results.codechef.mismatches.length > 0)) {
            allVerified = false;
        }
    }

    return {
        verified: allVerified,
        results
    };
}

module.exports = { verifyCodingProfiles };
