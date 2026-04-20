const { describe, test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { runCli, makeInitedRepo, cleanup } = require("./helpers");

describe("validate", () => {
  let dir;
  before(() => {
    dir = makeInitedRepo();
  });
  after(() => cleanup(dir));

  test("reports OK on a fresh init", () => {
    const r = runCli(["validate"], dir);
    assert.equal(r.exitCode, 0, r.stderr);
    assert.match(r.stdout, /OK/);
  });

  test("flags missing scope file with exit 1", () => {
    fs.unlinkSync(path.join(dir, ".claude/knowledge/decisions.md"));
    const r = runCli(["validate"], dir);
    assert.equal(r.exitCode, 1);
    assert.match(r.stdout, /Missing decisions\.md/);
  });

  test("flags missing INDEX.md", () => {
    fs.unlinkSync(path.join(dir, ".claude/knowledge/INDEX.md"));
    const r = runCli(["validate"], dir);
    assert.equal(r.exitCode, 1);
    assert.match(r.stdout, /Missing INDEX\.md/);
  });
});
