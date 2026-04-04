const { verifyLeetCode } = require('../src/services/leetCodeVerify');
const { verifyCodeforces } = require('../src/services/codeforcesVerify');
const { verifyCodechef } = require('../src/services/codechefVerify');

async function runTests() {
    console.log("================= LEETCODE TESTING =================");
    const lcParams = { username: "naveenmandal68" };
    const lcRes = await verifyLeetCode(lcParams);
    console.dir(lcRes, { depth: null });
    
    console.log("\n================ CODEFORCES TESTING ================");
    const cfParams = { username: "naveenmandal" };
    const cfRes = await verifyCodeforces(cfParams);
    console.dir(cfRes, { depth: null });
    
    console.log("\n================= CODECHEF TESTING =================");
    const ccParams = { username: "wise_hounds_69" };
    const ccRes = await verifyCodechef(ccParams);
    console.dir(ccRes, { depth: null });
}

runTests().catch(console.error);
