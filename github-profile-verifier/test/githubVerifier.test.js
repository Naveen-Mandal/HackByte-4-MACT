const test = require("node:test");
const assert = require("node:assert/strict");

const {
  extractGithubUsername,
} = require("../src/services/githubVerifier");

test("extractGithubUsername returns a username from a GitHub profile URL", () => {
  assert.equal(
    extractGithubUsername("https://github.com/octocat"),
    "octocat",
  );
});

test("extractGithubUsername rejects non-profile GitHub URLs", () => {
  assert.equal(
    extractGithubUsername("https://github.com/topics/javascript"),
    null,
  );
});

test("extractGithubUsername accepts plain usernames", () => {
  assert.equal(extractGithubUsername("octocat"), "octocat");
});
