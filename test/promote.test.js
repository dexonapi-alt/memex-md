const { describe, test, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { runCli, makeInitedRepo, cleanup } = require("./helpers");

// Mirror of src/commands/promote.ts projectSlug()
function projectSlug(cwd) {
  return cwd.replace(/[:\\/]/g, "-");
}

function memoryDirFor(cwd) {
  return path.join(
    os.homedir(),
    ".claude",
    "projects",
    projectSlug(cwd),
    "memory"
  );
}

function seedMemory(projectDir, files) {
  const dir = memoryDirFor(projectDir);
  fs.mkdirSync(dir, { recursive: true });
  for (const [name, content] of Object.entries(files)) {
    fs.writeFileSync(path.join(dir, name), content);
  }
  return dir;
}

function removeMemory(projectDir) {
  const dir = memoryDirFor(projectDir);
  fs.rmSync(dir, { recursive: true, force: true });
}

describe("promote", () => {
  const dirs = [];
  after(() =>
    dirs.forEach((d) => {
      removeMemory(d);
      cleanup(d);
    })
  );

  test("reports gracefully when no machine memory exists", () => {
    const dir = makeInitedRepo();
    dirs.push(dir);
    const r = runCli(["promote"], dir);
    assert.equal(r.exitCode, 0, r.stderr);
    assert.match(r.stdout, /No machine memory found/);
  });

  test("--list shows entries without modifying anything", () => {
    const dir = makeInitedRepo();
    dirs.push(dir);
    seedMemory(dir, {
      "user_shell.md": `---\nname: shell preference\ndescription: uses ; instead of &&\ntype: user\n---\n\nUser uses ; not && in PowerShell.\n`,
      "project_style.md": `---\nname: functional components\ndescription: repo uses functional React only\ntype: project\n---\n\nThis repo uses functional React components only.\n`,
    });

    const r = runCli(["promote", "--list"], dir);
    assert.equal(r.exitCode, 0, r.stderr);
    assert.match(r.stdout, /Found 2 machine-memory entries/);
    assert.match(r.stdout, /user_shell\.md/);
    assert.match(r.stdout, /project_style\.md/);

    const memDir = memoryDirFor(dir);
    assert.ok(fs.existsSync(path.join(memDir, "user_shell.md")));
    assert.ok(fs.existsSync(path.join(memDir, "project_style.md")));
  });

  test("--all + --dry-run auto-classifies and reports without writing", () => {
    const dir = makeInitedRepo();
    dirs.push(dir);
    const memDir = seedMemory(dir, {
      "project_thing.md": `---\nname: a project rule\ndescription: something repo-level\ntype: project\n---\n\nBody of a project-level rule.\n`,
    });

    const r = runCli(["promote", "--all", "--dry-run"], dir);
    assert.equal(r.exitCode, 0, r.stderr);
    assert.match(r.stdout, /\[dry-run\] would append/);

    const decisions = fs.readFileSync(
      path.join(dir, ".claude/knowledge/decisions.md"),
      "utf8"
    );
    assert.doesNotMatch(decisions, /a project rule/);
    assert.ok(fs.existsSync(path.join(memDir, "project_thing.md")));
  });

  test("--all writes classified entries and deletes source files", () => {
    const dir = makeInitedRepo();
    dirs.push(dir);
    const memDir = seedMemory(dir, {
      "a_project_thing.md": `---\nname: a project rule\ndescription: repo-level\ntype: project\n---\n\nBody of a project-level rule.\n`,
      "b_user_habit.md": `---\nname: shell habit\ndescription: user-level habit\ntype: user\n---\n\nUser habit body.\n`,
    });

    const r = runCli(["promote", "--all"], dir);
    assert.equal(r.exitCode, 0, r.stderr);

    // project -> decisions (classifyDefault maps 'project' to 'd')
    const decisions = fs.readFileSync(
      path.join(dir, ".claude/knowledge/decisions.md"),
      "utf8"
    );
    assert.match(decisions, /## a project rule/);
    assert.match(decisions, /promoted from machine memory/);

    // Promoted source is deleted
    assert.ok(!fs.existsSync(path.join(memDir, "a_project_thing.md")));

    // User-type entry default is 'k' (keep), so b_user_habit.md remains
    assert.ok(fs.existsSync(path.join(memDir, "b_user_habit.md")));
  });
});
