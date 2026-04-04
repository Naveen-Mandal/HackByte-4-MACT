import { verifyGithubProfile } from "./src/services/githubverifyservice.js";
import { verifyLeetCode } from "./src/services/leetCodeVerify.js";
import { verifyCodeforces } from "./src/services/codeforcesVerify.js";
import { verifyCodechef } from "./src/services/codechefVerify.js";
import 'dotenv/config';

async function testApis() {
  console.log("=== Testing GitHub ===");
  try {
    const gh = await verifyGithubProfile("torvalds");
    console.log("GitHub Success:", gh.username);
  } catch(e) {
    console.error("GitHub Fail:", e.message);
  }

  console.log("\n=== Testing LeetCode ===");
  try {
    const lc = await verifyLeetCode({username: "striver_79"});
    console.log("LeetCode Success:", Object.keys(lc));
    if (lc.error) console.log("Inner leetcode error:", lc.error);
  } catch(e) {
    console.error("LeetCode Fail:", e.message);
  }

  console.log("\n=== Testing Codeforces ===");
  try {
    const cf = await verifyCodeforces({username: "tourist"});
    console.log("Codeforces Success:", Object.keys(cf));
    if (cf.error) console.log("Inner CF error:", cf.error);
  } catch(e) {
    console.error("Codeforces Fail:", e.message);
  }

  console.log("\n=== Testing CodeChef ===");
  try {
    const cc = await verifyCodechef({username: "gennady.korotkevich"});
    console.log("CodeChef Success:", Object.keys(cc));
    if (cc.error) console.log("Inner CC error:", cc.error);
  } catch(e) {
    console.error("CodeChef Fail:", e.message);
  }
}

testApis();
