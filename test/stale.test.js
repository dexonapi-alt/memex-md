const { describe, test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { runCli, makeInitedRepo, cleanup } = require("./helpers");

describe("stale", () => {
  let dir;
  before(() => {
    dir = makeInitedRepo();
  });
  after(() => cleanup(dir));

  test("--brief is silent when nothing is stale", () => {
    const r = runCli(["stale", "--brief"], dir);
    assert.equal(r.exitCode, 0, r.stderr);
    assert.equal(r.stdout.trim(), "");
  });

  test("flags an old entry (verbose)", () => {
    const p = path.join(dir, ".claude/knowledge/decisions.md");
    fs.appendFileSync(
      p,
      "\n## Old decision\n\n- **Added:** 2020-01-01\n- reason\n"
    );
    const r = runCli(["stale"], dir);
    assert.equal(r.exitCode, 0);
    assert.match(r.stdout, /Old decision/);
    assert.match(r.stdout, /2020-01-01/);
  });

  test("--brief emits one-liner when stale entries exist", () => {
    const r = runCli(["stale", "--brief"], dir);
    assert.equal(r.exitCode, 0);
    assert.match(r.stdout, /\[memex-md\]/);
    assert.match(r.stdout, /older than/);
  });

  test("--days must be positive", () => {
    const r = runCli(["stale", "--days", "0"], dir);
    assert.equal(r.exitCode, 1);
    assert.match(r.stderr, /must be a positive/);
  });
});
