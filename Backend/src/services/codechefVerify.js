import * as cheerio from "cheerio";

async function verifyCodechef(claimedData) {
    const { username, currentRating, maxRating, stars, globalRank, contestsGiven } = claimedData;
    if (!username) return { error: "Username not provided" };

    try {
        const response = await fetch(`https://www.codechef.com/users/${username}`);
        if (response.status === 404) {
             return { verified: false, error: "User not found" };
        }

        const html = await response.text();
        const $ = cheerio.load(html);

        const actualRatingStr = $('.rating-number').text().trim();
        const actualRating = actualRatingStr ? parseInt(actualRatingStr, 10) : 0;
        
        let actualStars = 0;
        const actualStarsStr = $('.rating-star').text().trim();
        if (actualStarsStr) {
            const match = actualStarsStr.match(/(\d+)/);
            if (match) actualStars = parseInt(match[1], 10);
        }
        
        const actualGlobalRankStr = $('.rating-ranks .inline-list li:first-child a').text().trim();
        const actualGlobalRank = actualGlobalRankStr ? parseInt(actualGlobalRankStr, 10) : null;

        const maxRatingStr = $('small').filter(function() { return $(this).text().includes('Highest Rating'); }).text();
        let actualMaxRating = actualRating;
        if (maxRatingStr) {
            const match = maxRatingStr.match(/Highest Rating\s+(\d+)/);
            if (match) actualMaxRating = parseInt(match[1], 10);
        }

        let actualContestsGiven = null;
        $('h3').each((i, el) => {
            if ($(el).text().includes("Contests")) {
                const countStr = $(el).text().replace(/[^0-9]/g, '');
                if (countStr) actualContestsGiven = parseInt(countStr, 10);
            }
        });

        const results = {
            verified: true,
            actual: {
                currentRating: actualRating,
                maxRating: actualMaxRating,
                stars: actualStars,
                globalRank: actualGlobalRank,
                contestsGiven: actualContestsGiven
            },
            claims: claimedData,
            mismatches: []
        };

        if (currentRating !== undefined && currentRating > actualRating) {
            results.mismatches.push(`Claimed rating (${currentRating}) is higher than actual (${actualRating})`);
        }
        if (maxRating !== undefined && maxRating > actualMaxRating) {
            results.mismatches.push(`Claimed max rating (${maxRating}) is higher than actual (${actualMaxRating})`);
        }
        if (stars !== undefined) {
             const claimedStarsNum = typeof stars === 'number' ? stars : parseInt(String(stars).replace(/[^0-9]/g, ''), 10);
             if (claimedStarsNum > actualStars) {
                 results.mismatches.push(`Claimed stars (${claimedStarsNum}) is higher than actual (${actualStars})`);
             }
        }
        if (globalRank !== undefined && actualGlobalRank !== null && globalRank < actualGlobalRank) {
            results.mismatches.push(`Claimed global rank (${globalRank}) is better than actual (${actualGlobalRank})`);
        }
        if (contestsGiven !== undefined && actualContestsGiven !== null && contestsGiven > actualContestsGiven) {
             results.mismatches.push(`Claimed contests given (${contestsGiven}) is higher than actual (${actualContestsGiven})`);
        }

        results.verified = results.mismatches.length === 0;
        return results;

    } catch (error) {
        return { verified: false, error: error.message };
    }
}

export {  verifyCodechef  };
