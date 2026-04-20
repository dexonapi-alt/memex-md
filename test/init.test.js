const { describe, test, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { runCli, makeTempRepo, cleanup } = require("./helpers");

describe("init", () => {
  const dirs = [];
  after(() => dirs.forEach(cleanup));

  test("scaffolds knowledge base, skill, hooks, PR template", () => {
    const dir = makeTempRepo();
    dirs.push(dir);
    const r = runCli(["init"], dir);
    assert.equal(r.exitCode, 0, r.stderr);

    for (const p of [
      ".claude/knowledge/INDEX.md",
      ".claude/knowledge/architecture.md",
      ".claude/knowledge/decisions.md",
      ".claude/knowledge/patterns.md",
      ".claude/knowledge/gotchas.md",
      ".claude/knowledge/glossary.md",
      ".claude/skills/knowledge-update/SKILL.md",
      ".claude/hooks/pre-commit",
      ".claude/settings.json",
      ".github/PULL_REQUEST_TEMPLATE.md",
    ]) {
      assert.ok(
        fs.existsSync(path.join(dir, p)),
        `expected ${p} to exist`
      );
    }
  });

  test("fails when .claude/knowledge/ already exists (no --force)", () => {
    const dir = makeTempRepo();
    dirs.push(dir);
    assert.equal(runCli(["init"], dir).exitCode, 0);
    const r = runCli(["init"], dir);
    assert.equal(r.exitCode, 1);
    assert.match(r.stderr, /already exists/);
  });

  test("--force re-runs over an existing install", () => {
    const dir = makeTempRepo();
    dirs.push(dir);
    runCli(["init"], dir);
    const r = runCli(["init", "--force"], dir);
    assert.equal(r.exitCode, 0, r.stderr);
  });

  test("settings.json registers PostToolUse + SessionStart hooks", () => {
    const dir = makeTempRepo();
    dirs.push(dir);
    runCli(["init"], dir);
    const s = JSON.parse(
      fs.readFileSync(path.join(dir, ".claude/settings.json"), "utf8")
    );
    assert.ok(Array.isArray(s.hooks.PostToolUse));
    assert.ok(Array.isArray(s.hooks.SessionStart));
    assert.match(
      JSON.stringify(s.hooks.PostToolUse),
      /memex-md-knowledge-update/
    );
    assert.match(JSON.stringify(s.hooks.SessionStart), /memex-md stale/);
  });
});
