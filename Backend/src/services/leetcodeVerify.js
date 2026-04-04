async function verifyLeetCode(claimedData) {
    const { username, totalSolved, ranking, easySolved, mediumSolved, hardSolved, currentRating, maxRating, contestsGiven } = claimedData;
    if (!username) return { error: "Username not provided" };

    try {
        const query = `
            query getUserProfile($username: String!) {
                matchedUser(username: $username) {
                    profile { ranking }
                    submitStats: submitStatsGlobal {
                        acSubmissionNum {
                            difficulty
                            count
                        }
                    }
                }
                userContestRanking(username: $username) {
                    attendedContestsCount
                    rating
                }
                userContestRankingHistory(username: $username) {
                    rating
                }
            }
        `;
        
        const response = await fetch("https://leetcode.com/graphql/", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Referer": "https://leetcode.com"
            },
            body: JSON.stringify({
                query: query,
                variables: { username }
            })
        });

        const result = await response.json();
        
        if (!result.data || (!result.data.matchedUser && !result.data.userContestRanking)) {
            return { verified: false, error: "User not found or API error" };
        }

        const data = result.data.matchedUser;
        const contestData = result.data.userContestRanking || {};
        const historyData = result.data.userContestRankingHistory || [];
        
        const actualRanking = data?.profile?.ranking || 0;
        const stats = data?.submitStats?.acSubmissionNum || [];
        
        let actualEasy = 0, actualMedium = 0, actualHard = 0, actualTotal = 0;
        stats.forEach(stat => {
            if (stat.difficulty === "All") actualTotal = stat.count;
            if (stat.difficulty === "Easy") actualEasy = stat.count;
            if (stat.difficulty === "Medium") actualMedium = stat.count;
            if (stat.difficulty === "Hard") actualHard = stat.count;
        });

        const actualCurrentRating = contestData.rating || 0;
        const actualContestsGiven = contestData.attendedContestsCount || 0;
        
        let actualMaxRating = 0;
        if (historyData.length > 0) {
            actualMaxRating = Math.max(...historyData.map(h => h.rating || 0));
        }
        if (actualCurrentRating > actualMaxRating) actualMaxRating = actualCurrentRating;

        const results = {
            verified: true,
            actual: {
                totalSolved: actualTotal,
                ranking: actualRanking,
                easySolved: actualEasy,
                mediumSolved: actualMedium,
                hardSolved: actualHard,
                currentRating: Math.round(actualCurrentRating),
                maxRating: Math.round(actualMaxRating),
                contestsGiven: actualContestsGiven
            },
            claims: claimedData,
            mismatches: []
        };

        if (totalSolved !== undefined && totalSolved > actualTotal) {
            results.mismatches.push(`Claimed total solved (${totalSolved}) is higher than actual (${actualTotal})`);
        }
        if (ranking !== undefined && actualRanking !== 0 && ranking < actualRanking) {
            results.mismatches.push(`Claimed ranking (${ranking}) is better than actual (${actualRanking})`);
        }
        if (easySolved !== undefined && easySolved > actualEasy) {
            results.mismatches.push(`Claimed easy solved (${easySolved}) is higher than actual (${actualEasy})`);
        }
        if (mediumSolved !== undefined && mediumSolved > actualMedium) {
            results.mismatches.push(`Claimed medium solved (${mediumSolved}) is higher than actual (${actualMedium})`);
        }
        if (hardSolved !== undefined && hardSolved > actualHard) {
            results.mismatches.push(`Claimed hard solved (${hardSolved}) is higher than actual (${actualHard})`);
        }
        if (currentRating !== undefined && currentRating > results.actual.currentRating) {
            results.mismatches.push(`Claimed current rating (${currentRating}) is higher than actual (${results.actual.currentRating})`);
        }
        if (maxRating !== undefined && maxRating > results.actual.maxRating) {
             results.mismatches.push(`Claimed max rating (${maxRating}) is higher than actual (${results.actual.maxRating})`);
        }
        if (contestsGiven !== undefined && contestsGiven > results.actual.contestsGiven) {
            results.mismatches.push(`Claimed contests given (${contestsGiven}) is higher than actual (${results.actual.contestsGiven})`);
        }

        results.verified = results.mismatches.length === 0;
        return results;

    } catch (error) {
        return { verified: false, error: error.message };
    }
}

export {  verifyLeetCode  };
