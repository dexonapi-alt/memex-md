const { describe, test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { runCli, git, makeInitedRepo, cleanup } = require("./helpers");

describe("check", () => {
  let dir;
  before(() => {
    dir = makeInitedRepo();
    git(["add", "."], dir);
    git(["commit", "-q", "-m", "scaffold"], dir);
  });
  after(() => cleanup(dir));

  test("no staged changes: reports OK", () => {
    const r = runCli(["check", "--staged"], dir);
    assert.equal(r.exitCode, 0, r.stderr);
    assert.match(r.stdout, /No changes/);
  });

  test("sensitive file staged without KB update: warns, exits 0", () => {
    fs.writeFileSync(path.join(dir, "migration.sql"), "-- create table");
    git(["add", "migration.sql"], dir);
    const r = runCli(["check", "--staged"], dir);
    assert.equal(r.exitCode, 0);
    assert.match(r.stdout, /Sensitive files/);
    assert.match(r.stdout, /migration\.sql/);
  });

  test("same scenario with --strict: exits 1", () => {
    const r = runCli(["check", "--staged", "--strict"], dir);
    assert.equal(r.exitCode, 1);
  });

  test("sensitive + KB update staged together: OK even with --strict", () => {
    runCli(["add", "decisions", "schema change rationale"], dir);
    git(["add", ".claude/knowledge/decisions.md"], dir);
    const r = runCli(["check", "--staged", "--strict"], dir);
    assert.equal(r.exitCode, 0);
    assert.match(r.stdout, /OK/);
  });

  test("CI=true env forces --strict behavior", () => {
    // reset: commit everything then stage a sensitive file alone again
    git(["commit", "-q", "-m", "sync"], dir);
    fs.writeFileSync(path.join(dir, "auth-config.env"), "SECRET=x");
    git(["add", "auth-config.env"], dir);
    const r = runCli(["check", "--staged"], dir, { CI: "true" });
    assert.equal(r.exitCode, 1);
  });
});
