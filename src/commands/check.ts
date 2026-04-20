import {
  changedFilesInRange,
  changedFilesStaged,
  isGitRepo,
} from "../lib/git";
import { matchesAny } from "../lib/glob";
import { requireKnowledgeBase } from "../lib/paths";

const DEFAULT_SENSITIVE = [
  "**/migrations/**",
  "**/*.sql",
  "**/auth/**",
  "**/*auth*",
  "**/schema.prisma",
  "**/*.graphql",
  "**/*.env*",
  "**/Dockerfile",
  "**/docker-compose*.yml",
  "**/docker-compose*.yaml",
  "**/.github/workflows/**",
];

const KNOWLEDGE_GLOB = ".claude/knowledge/**";

function parseArgs(args: string[]): {
  base: string;
  patterns: string[];
  strict: boolean;
  staged: boolean;
} {
  const baseIdx = args.indexOf("--base");
  const base =
    baseIdx >= 0 && args[baseIdx + 1] ? args[baseIdx + 1] : "origin/main...HEAD";

  const patIdx = args.indexOf("--patterns");
  const patterns =
    patIdx >= 0 && args[patIdx + 1]
      ? args[patIdx + 1].split(",").map((s) => s.trim()).filter(Boolean)
      : DEFAULT_SENSITIVE;

  const strict = args.includes("--strict");
  const staged = args.includes("--staged");
  return { base, patterns, strict, staged };
}

export async function check(args: string[]): Promise<void> {
  requireKnowledgeBase();
  if (!isGitRepo()) {
    console.error("Not inside a git repository.");
    process.exit(2);
  }

  const { base, patterns, strict, staged } = parseArgs(args);
  const scope = staged ? "staged changes" : base;

  let files: string[];
  try {
    files = staged ? changedFilesStaged() : changedFilesInRange(base);
  } catch (err) {
    console.error(err instanceof Error ? err.message : err);
    if (!staged) {
      console.error(
        `Tip: ensure ${base.split("...")[0] || base} is fetched locally.`
      );
    }
    process.exit(2);
  }

  if (files.length === 0) {
    console.log(`No changes in ${scope}.`);
    return;
  }

  const sensitiveChanged = files.filter((f) => matchesAny(f, patterns));
  const knowledgeChanged = files.filter((f) =>
    matchesAny(f, [KNOWLEDGE_GLOB])
  );

  if (sensitiveChanged.length === 0) {
    console.log(`No sensitive files changed in ${scope}. OK.`);
    return;
  }

  console.log(`Sensitive files changed in ${scope}:`);
  for (const f of sensitiveChanged) console.log(`  ${f}`);

  if (knowledgeChanged.length > 0) {
    console.log(`\nKnowledge base updated:`);
    for (const f of knowledgeChanged) console.log(`  ${f}`);
    console.log("\nOK.");
    return;
  }

  console.log(
    `\nNo updates to .claude/knowledge/ detected.\n` +
      `Sensitive changes should be accompanied by a knowledge-base entry ` +
      `(typically decisions.md or gotchas.md).`
  );
  console.log(
    `\nFix: run \`claude-memex draft ${staged ? "--staged" : "--from-commit <sha>"} --write\` or add entries manually.`
  );

  if (strict || process.env.CI) {
    process.exit(1);
  }
}
