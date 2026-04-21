const { describe, test, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { runCli, makeTempRepo, cleanup } = require("./helpers");

describe("init scaffolds slash commands + plans dir", () => {
  const dirs = [];
  after(() => dirs.forEach(cleanup));

  test("installs all 9 /memex:* slash commands", () => {
    const dir = makeTempRepo();
    dirs.push(dir);
    const r = runCli(["init"], dir);
    assert.equal(r.exitCode, 0, r.stderr);

    const cmdDir = path.join(dir, ".claude/commands/memex");
    const expected = [
      "preference.md",
      "fix.md",
      "plan.md",
      "approve-plan.md",
      "apply-plan.md",
      "decide.md",
      "pattern.md",
      "arch.md",
      "term.md",
    ];
    for (const name of expected) {
      const p = path.join(cmdDir, name);
      assert.ok(fs.existsSync(p), `expected ${p} to exist`);
      const content = fs.readFileSync(p, "utf8");
      assert.match(content, /^---/m, `${name} should have frontmatter`);
      assert.match(content, /\$ARGUMENTS/, `${name} should reference $ARGUMENTS`);
    }
  });

  test("plan lifecycle templates describe the full state machine", () => {
    const dir = makeTempRepo();
    dirs.push(dir);
    runCli(["init"], dir);
    const cmdDir = path.join(dir, ".claude/commands/memex");

    const planMd = fs.readFileSync(path.join(cmdDir, "plan.md"), "utf8");
    assert.match(planMd, /--for <github-username>/);
    assert.match(planMd, /Status:\*\*\s*draft/);
    assert.match(planMd, /Assignee:/);

    const approveMd = fs.readFileSync(
      path.join(cmdDir, "approve-plan.md"),
      "utf8"
    );
    assert.match(approveMd, /draft/);
    assert.match(approveMd, /approved/);

    const applyMd = fs.readFileSync(path.join(cmdDir, "apply-plan.md"), "utf8");
    assert.match(applyMd, /in-progress/);
    assert.match(applyMd, /implemented/);
  });

  test("plans INDEX seed documents the full lifecycle vocabulary", () => {
    const dir = makeTempRepo();
    dirs.push(dir);
    runCli(["init"], dir);
    const indexMd = fs.readFileSync(
      path.join(dir, ".claude/plans/INDEX.md"),
      "utf8"
    );
    assert.match(indexMd, /draft/);
    assert.match(indexMd, /approved/);
    assert.match(indexMd, /in-progress/);
    assert.match(indexMd, /implemented/);
    assert.match(indexMd, /## Lifecycle/);
  });

  test("plans INDEX seed has both ## Plans and ## Applied sections", () => {
    const dir = makeTempRepo();
    dirs.push(dir);
    runCli(["init"], dir);
    const indexMd = fs.readFileSync(
      path.join(dir, ".claude/plans/INDEX.md"),
      "utf8"
    );
    assert.match(indexMd, /^## Plans$/m);
    assert.match(indexMd, /^## Applied$/m);
  });

  test("apply-plan template describes the archiving step", () => {
    const dir = makeTempRepo();
    dirs.push(dir);
    runCli(["init"], dir);
    const applyPlan = fs.readFileSync(
      path.join(dir, ".claude/commands/memex/apply-plan.md"),
      "utf8"
    );
    assert.match(applyPlan, /git mv \.claude\/plans\//);
    assert.match(applyPlan, /plans\/applied\//);
  });

  test("scaffolds .claude/plans/INDEX.md", () => {
    const dir = makeTempRepo();
    dirs.push(dir);
    runCli(["init"], dir);
    const p = path.join(dir, ".claude/plans/INDEX.md");
    assert.ok(fs.existsSync(p));
    assert.match(fs.readFileSync(p, "utf8"), /# Plans/);
  });

  test("init output mentions slash commands + plans", () => {
    const dir = makeTempRepo();
    dirs.push(dir);
    const r = runCli(["init"], dir);
    assert.match(r.stdout, /\.claude\/commands\/memex\//);
    assert.match(r.stdout, /\.claude\/plans\//);
  });

  test("CLAUDE.md block mentions re-read rule and slash commands", () => {
    const dir = makeTempRepo();
    dirs.push(dir);
    runCli(["init"], dir);
    const claudeMd = fs.readFileSync(path.join(dir, "CLAUDE.md"), "utf8");
    assert.match(claudeMd, /Re-read rule/);
    assert.match(claudeMd, /\/memex:preference/);
    assert.match(claudeMd, /\/memex:fix/);
    assert.match(claudeMd, /\/memex:plan/);
    assert.match(claudeMd, /\.claude\/plans\/INDEX\.md/);
  });
});
