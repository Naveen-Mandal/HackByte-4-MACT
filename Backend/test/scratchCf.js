async function run() {
    const username = "naveenmandal";
    console.log("--- CF INFO ---");
    let res = await fetch(`https://codeforces.com/api/user.info?handles=${username}`);
    let data = await res.json();
    console.log("INFO", data.result[0]);

    console.log("--- CF RATING (CONTESTS GIVEN) ---");
    res = await fetch(`https://codeforces.com/api/user.rating?handle=${username}`);
    data = await res.json();
    console.log("Contests Given:", data.result.length);

    console.log("--- CF STATUS (SOLVED) ---");
    res = await fetch(`https://codeforces.com/api/user.status?handle=${username}`);
    data = await res.json();
    
    let solvedUnique = new Set();
    let ratingGaps = {};
    for (let sub of data.result) {
        if (sub.verdict === "OK") {
            // Problem ID: contestId + index
            let pId = sub.problem.contestId + sub.problem.index;
            if (!solvedUnique.has(pId)) {
                solvedUnique.add(pId);
                let r = sub.problem.rating;
                if (r) {
                    ratingGaps[r] = (ratingGaps[r] || 0) + 1;
                }
            }
        }
    }
    console.log("Total unique solved:", solvedUnique.size);
    console.log("Rating gaps:", ratingGaps);
}

run().catch(console.dir);
