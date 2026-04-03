

async function run() {
    console.log("--- LC ---");
    const query = `
        query userContestRankingInfo($username: String!) {
            userContestRanking(username: $username) {
                attendedContestsCount
                rating
                globalRanking
                topPercentage
                badge {
                    name
                }
            }
            userContestRankingHistory(username: $username) {
                rating
            }
        }
    `;
    const res = await fetch("https://leetcode.com/graphql/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: query, variables: { username: "naveenmandal68" } })
    });
    const data = await res.json();
    console.log(JSON.stringify(data, null, 2));
}

run().catch(console.dir);
