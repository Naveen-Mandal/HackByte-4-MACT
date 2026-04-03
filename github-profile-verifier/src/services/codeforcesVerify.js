async function verifyCodeforces(claimedData) {
    const { username, rating, maxRating, rank, totalSolved, contestsGiven, ratingGaps } = claimedData;
    if (!username) return { error: "Username not provided" };

    try {
        // Fetch User Info
        let response = await fetch(`https://codeforces.com/api/user.info?handles=${username}`);
        let data = await response.json();

        if (data.status !== "OK" || !data.result || data.result.length === 0) {
            return { verified: false, error: "User not found or API error on info fetch" };
        }
        const user = data.result[0];

        // Fetch User Rating (Contests)
        response = await fetch(`https://codeforces.com/api/user.rating?handle=${username}`);
        data = await response.json();
        const actualContestsGiven = (data.status === "OK" && data.result) ? data.result.length : 0;

        // Fetch User Status (Solved Problems)
        response = await fetch(`https://codeforces.com/api/user.status?handle=${username}`);
        data = await response.json();
        
        let actualSolvedUnique = new Set();
        let actualRatingGaps = {};
        
        if (data.status === "OK" && data.result) {
            for (let sub of data.result) {
                if (sub.verdict === "OK" && sub.problem && sub.problem.contestId) {
                    let pId = sub.problem.contestId + sub.problem.index;
                    if (!actualSolvedUnique.has(pId)) {
                        actualSolvedUnique.add(pId);
                        let r = sub.problem.rating;
                        if (r) {
                            actualRatingGaps[r] = (actualRatingGaps[r] || 0) + 1;
                        }
                    }
                }
            }
        }

        const results = {
            verified: true,
            actual: {
                rating: user.rating || 0,
                maxRating: user.maxRating || 0,
                rank: user.rank || "unrated",
                maxRank: user.maxRank || "unrated",
                contestsGiven: actualContestsGiven,
                totalSolved: actualSolvedUnique.size,
                ratingGaps: actualRatingGaps
            },
            claims: claimedData,
            mismatches: []
        };

        if (rating !== undefined && rating > results.actual.rating) {
            results.mismatches.push(`Claimed rating (${rating}) is higher than actual (${results.actual.rating})`);
        }
        if (maxRating !== undefined && maxRating > results.actual.maxRating) {
            results.mismatches.push(`Claimed max rating (${maxRating}) is higher than actual (${results.actual.maxRating})`);
        }
        if (rank !== undefined) {
            const safeClaimedRank = String(rank).toLowerCase();
            const actualRank = results.actual.rank.toLowerCase();
            const actualMaxRank = results.actual.maxRank.toLowerCase();
            
            if (safeClaimedRank !== actualRank && safeClaimedRank !== actualMaxRank) {
                results.mismatches.push(`Claimed rank (${rank}) does not match actual or max rank (${user.rank})`);
            }
        }
        if (contestsGiven !== undefined && contestsGiven > results.actual.contestsGiven) {
            results.mismatches.push(`Claimed contests given (${contestsGiven}) is higher than actual (${results.actual.contestsGiven})`);
        }
        if (totalSolved !== undefined && totalSolved > results.actual.totalSolved) {
            results.mismatches.push(`Claimed total solved (${totalSolved}) is higher than actual (${results.actual.totalSolved})`);
        }
        if (ratingGaps && typeof ratingGaps === 'object') {
            for (const [gap, count] of Object.entries(ratingGaps)) {
                const actualCount = actualRatingGaps[gap] || 0;
                if (count > actualCount) {
                    results.mismatches.push(`Claimed ${count} problems solved at rating gap ${gap}, but actual is ${actualCount}`);
                }
            }
        }

        results.verified = results.mismatches.length === 0;
        return results;

    } catch (error) {
        return { verified: false, error: error.message };
    }
}

module.exports = { verifyCodeforces };
