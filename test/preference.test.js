const { describe, test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { runCli, makeInitedRepo, cleanup } = require("./helpers");

describe("preference", () => {
  let dir;
  before(() => {
    dir = makeInitedRepo();
  });
  after(() => cleanup(dir));

  test("appends a new bullet under ## Preferences", () => {
    const r = runCli(["preference", "tabs not spaces for indentation"], dir);
    assert.equal(r.exitCode, 0, r.stderr);

    const claudeMd = fs.readFileSync(path.join(dir, "CLAUDE.md"), "utf8");
    assert.match(claudeMd, /## Preferences/);
    assert.match(claudeMd, /- tabs not spaces for indentation/);
  });

  test("second invocation is idempotent — does not duplicate", () => {
    runCli(["preference", "tabs not spaces for indentation"], dir);
    const claudeMd = fs.readFileSync(path.join(dir, "CLAUDE.md"), "utf8");
    const count = (claudeMd.match(/- tabs not spaces for indentation/g) || [])
      .length;
    assert.equal(count, 1);
  });

  test("multiple distinct preferences accumulate", () => {
    runCli(["preference", "commit messages use Conventional Commits"], dir);
    runCli(["preference", "prefer async/await over .then() chains"], dir);
    const claudeMd = fs.readFileSync(path.join(dir, "CLAUDE.md"), "utf8");
    assert.match(claudeMd, /tabs not spaces/);
    assert.match(claudeMd, /Conventional Commits/);
    assert.match(claudeMd, /prefer async\/await/);
  });

  test("rejects empty input", () => {
    const r = runCli(["preference"], dir);
    assert.equal(r.exitCode, 1);
    assert.match(r.stderr, /Usage:/);
  });

  test("pref alias also works", () => {
    const r = runCli(["pref", "alias preference"], dir);
    assert.equal(r.exitCode, 0);
    const claudeMd = fs.readFileSync(path.join(dir, "CLAUDE.md"), "utf8");
    assert.match(claudeMd, /alias preference/);
  });
});
