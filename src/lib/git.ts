import { runSync } from "./exec";

export function isGitRepo(): boolean {
  return runSync("git", ["rev-parse", "--git-dir"]).exitCode === 0;
}

function requireOk(r: { exitCode: number; stderr: string; stdout: string }): string {
  if (r.exitCode !== 0) {
    throw new Error(`git failed (exit ${r.exitCode}): ${r.stderr.trim()}`);
  }
  return r.stdout;
}

export function diffWorking(): string {
  return requireOk(runSync("git", ["diff", "HEAD"]));
}

export function diffStaged(): string {
  return requireOk(runSync("git", ["diff", "--cached"]));
}

export function diffLastCommit(): string {
  return requireOk(runSync("git", ["diff", "HEAD~1", "HEAD"]));
}

export function diffCommit(sha: string): string {
  return requireOk(runSync("git", ["show", sha]));
}

export function diffRange(range: string): string {
  return requireOk(runSync("git", ["diff", range]));
}

export function changedFilesInRange(range: string): string[] {
  const out = requireOk(runSync("git", ["diff", "--name-only", range]));
  return out.split("\n").filter((s) => s.length > 0);
}

export function changedFilesStaged(): string[] {
  const out = requireOk(runSync("git", ["diff", "--name-only", "--cached"]));
  return out.split("\n").filter((s) => s.length > 0);
}

export function currentBranch(): string {
  return requireOk(runSync("git", ["rev-parse", "--abbrev-ref", "HEAD"])).trim();
}
