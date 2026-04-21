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

  test("re-running init on an existing install is a safe no-op", () => {
    const dir = makeTempRepo();
    dirs.push(dir);
    assert.equal(runCli(["init"], dir).exitCode, 0);
    const r = runCli(["init"], dir);
    // v0.6.2+: init no longer errors when .claude/knowledge/ exists —
    // user data is never touched regardless, so a second run is safe.
    assert.equal(r.exitCode, 0, r.stderr);
  });

  test("--force re-runs over an existing install", () => {
    const dir = makeTempRepo();
    dirs.push(dir);
    runCli(["init"], dir);
    const r = runCli(["init", "--force"], dir);
    assert.equal(r.exitCode, 0, r.stderr);
  });

  test("init --force preserves existing knowledge entries (no data loss)", () => {
    const dir = makeTempRepo();
    dirs.push(dir);
    runCli(["init"], dir);

    // Simulate real user entries across multiple scope files
    const decisionsPath = path.join(dir, ".claude/knowledge/decisions.md");
    const gotchasPath = path.join(dir, ".claude/knowledge/gotchas.md");

    const decisionEntry =
      "\n## Chose SQLite over Postgres for local dev\n\n- **Added:** 2026-01-01\n- context\n- decision\n";
    const gotchaEntry =
      "\n## Auth logs out after 15 min\n\n- **Added:** 2026-02-15\n- root cause: redis TTL\n";

    fs.appendFileSync(decisionsPath, decisionEntry);
    fs.appendFileSync(gotchasPath, gotchaEntry);

    const beforeDecisions = fs.readFileSync(decisionsPath, "utf8");
    const beforeGotchas = fs.readFileSync(gotchasPath, "utf8");

    // The bug this test protects against: init --force wiping user data.
    const r = runCli(["init", "--force"], dir);
    assert.equal(r.exitCode, 0, r.stderr);

    const afterDecisions = fs.readFileSync(decisionsPath, "utf8");
    const afterGotchas = fs.readFileSync(gotchasPath, "utf8");

    assert.equal(
      afterDecisions,
      beforeDecisions,
      "init --force must not touch existing decisions.md"
    );
    assert.equal(
      afterGotchas,
      beforeGotchas,
      "init --force must not touch existing gotchas.md"
    );
    assert.match(afterDecisions, /Chose SQLite over Postgres/);
    assert.match(afterGotchas, /Auth logs out after 15 min/);
  });

  test("init --force still refreshes package-managed files", () => {
    const dir = makeTempRepo();
    dirs.push(dir);
    runCli(["init"], dir);

    // Simulate a user having hand-edited a package-managed file (slash cmd)
    // and then running init --force to refresh — package file should be
    // restored to the template version.
    const fixPath = path.join(dir, ".claude/commands/memex/fix.md");
    fs.writeFileSync(fixPath, "LOCALLY HACKED CONTENT\n");

    const r = runCli(["init", "--force"], dir);
    assert.equal(r.exitCode, 0, r.stderr);

    const after = fs.readFileSync(fixPath, "utf8");
    assert.doesNotMatch(after, /LOCALLY HACKED/);
    assert.match(after, /memex:fix|gotcha/i);
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
