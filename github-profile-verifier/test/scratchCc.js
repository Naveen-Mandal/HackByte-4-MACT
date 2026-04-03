const cheerio = require('cheerio');

async function run() {
    const username = "wise_hounds_69";
    console.log("--- CC ---");
    
    const response = await fetch(`https://www.codechef.com/users/${username}`);
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
    let maxRating = actualRating;
    if (maxRatingStr) {
        const match = maxRatingStr.match(/Highest Rating\s+(\d+)/);
        if (match) maxRating = parseInt(match[1], 10);
    }

    // Usually contests given is shown in the rating graph or near it.
    // In codechef "Contests Participated" is inside a div with class "contest-participated-count".
    const contestsParticipationStr = $('.contest- участвовать-count').text() || $('.contest-participated-count b').text() || null;
    let contestsGiven = null;
    
    // We can also check strings "Contests Participated"
    $('h3').each((i, el) => {
        if ($(el).text().includes("Contests")) {
            const countStr = $(el).text().replace(/[^0-9]/g, '');
            if (countStr) contestsGiven = parseInt(countStr, 10);
        }
    });
    
    if (contestsGiven === null) {
        // Let's try locating from the "Contests Participated" text block
        const cp = $('b').filter(function() { return $(this).text().includes("Contests") || $(this).text().match(/\d+/) }).text();
        const divCp = $('.rating-data-section .bottom .pr-info').text()
        console.log("pr-info", divCp);
    }

    console.log({ actualRating, actualStars, actualGlobalRank, maxRating, contestsGiven });
    
    // Fallback: Codechef stores participation count in the graph script or h3 "Contests (N)"
    const contestsHeader = $('h3').filter(function() { return $(this).text().includes("Contests"); }).text();
    console.log("Contests header block:", contestsHeader);
}

run().catch(console.dir);
