const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const CLI = path.resolve(__dirname, "..", "dist", "cli.js");

if (!fs.existsSync(CLI)) {
  throw new Error(
    `dist/cli.js not found at ${CLI}. Run 'npm run build' before tests.`
  );
}

function runCli(args, cwd, extraEnv = {}) {
  const result = spawnSync(process.execPath, [CLI, ...args], {
    cwd,
    encoding: "utf8",
    env: { ...process.env, NO_COLOR: "1", CI: "", ...extraEnv },
  });
  return {
    stdout: result.stdout ?? "",
    stderr: result.stderr ?? "",
    exitCode: result.status ?? -1,
  };
}

function git(args, cwd) {
  return spawnSync("git", args, { cwd, encoding: "utf8" });
}

function makeTempRepo() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "memex-test-"));
  git(["init", "-q", "-b", "main"], dir);
  git(["config", "user.email", "test@example.com"], dir);
  git(["config", "user.name", "Test"], dir);
  git(["commit", "--allow-empty", "-q", "-m", "init"], dir);
  return dir;
}

function makeInitedRepo() {
  const dir = makeTempRepo();
  const r = runCli(["init"], dir);
  if (r.exitCode !== 0) {
    throw new Error(`init failed (${r.exitCode}):\n${r.stderr}\n${r.stdout}`);
  }
  return dir;
}

function cleanup(dir) {
  for (let i = 0; i < 3; i++) {
    try {
      fs.rmSync(dir, { recursive: true, force: true });
      return;
    } catch (err) {
      if (i === 2) throw err;
      // Retry — Windows occasionally holds file handles briefly.
    }
  }
}

module.exports = { CLI, runCli, git, makeTempRepo, makeInitedRepo, cleanup };
