const { describe, test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { runCli, makeInitedRepo, cleanup } = require("./helpers");

describe("add", () => {
  let dir;
  before(() => {
    dir = makeInitedRepo();
  });
  after(() => cleanup(dir));

  test("appends entry to a valid scope", () => {
    const r = runCli(["add", "decisions", "test decision"], dir);
    assert.equal(r.exitCode, 0, r.stderr);
    assert.match(r.stdout, /Appended to/);
    const content = fs.readFileSync(
      path.join(dir, ".claude/knowledge/decisions.md"),
      "utf8"
    );
    assert.match(content, /## test decision/);
    assert.match(content, /\*\*ID:\*\*\s*test-decision/);
    assert.match(content, /\*\*Added:\*\*\s*\d{4}-\d{2}-\d{2}/);
  });

  test("rejects invalid scope with non-zero exit", () => {
    const r = runCli(["add", "bogus", "x"], dir);
    assert.equal(r.exitCode, 1);
    assert.match(r.stderr, /Invalid scope/);
  });

  test("rejects missing title", () => {
    const r = runCli(["add", "decisions"], dir);
    assert.equal(r.exitCode, 1);
    assert.match(r.stderr, /Usage:/);
  });

  test("prints ID slug in success output", () => {
    const r = runCli(["add", "gotchas", "docx cells render empty"], dir);
    assert.equal(r.exitCode, 0);
    assert.match(r.stdout, /docx-cells-render-empty/);
  });
});
