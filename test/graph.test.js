const { describe, test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { runCli, makeInitedRepo, cleanup } = require("./helpers");

describe("graph", () => {
  let dir;
  before(() => {
    dir = makeInitedRepo();
    runCli(["add", "decisions", "chose SQLite"], dir);
    runCli(["add", "decisions", "moved to Postgres"], dir);
    // Hand-splice a supersedes link onto the second entry
    const p = path.join(dir, ".claude/knowledge/decisions.md");
    fs.appendFileSync(p, "- **Supersedes:** chose-sqlite\n");
    fs.appendFileSync(p, "- **Related:** moved-to-postgres\n"); // self-ref, harmless for graph test
  });
  after(() => cleanup(dir));

  test("ASCII output shows supersedes chain", () => {
    const r = runCli(["graph"], dir);
    assert.equal(r.exitCode, 0, r.stderr);
    assert.match(r.stdout, /chose-sqlite/);
    assert.match(r.stdout, /moved-to-postgres/);
    assert.match(r.stdout, /superseded by|supersedes/);
  });

  test("--mermaid emits a graph TD block", () => {
    const r = runCli(["graph", "--mermaid"], dir);
    assert.equal(r.exitCode, 0);
    assert.match(r.stdout, /```mermaid/);
    assert.match(r.stdout, /graph TD/);
    assert.match(r.stdout, /-->/);
  });

  test("empty KB prints a tidy message", () => {
    const emptyDir = makeInitedRepo();
    const r = runCli(["graph"], emptyDir);
    assert.equal(r.exitCode, 0);
    assert.match(r.stdout, /empty|\bno\b/i);
    cleanup(emptyDir);
  });
});
