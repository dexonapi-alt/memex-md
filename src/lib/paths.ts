import * as path from "node:path";
import * as fs from "node:fs";

export const VALID_SCOPES = [
  "architecture",
  "decisions",
  "patterns",
  "gotchas",
  "glossary",
] as const;

export type Scope = (typeof VALID_SCOPES)[number];

export function repoRoot(): string {
  return process.cwd();
}

export function claudeDir(): string {
  return path.join(repoRoot(), ".claude");
}

export function knowledgeDir(): string {
  return path.join(claudeDir(), "knowledge");
}

export function knowledgeFile(scope: Scope): string {
  return path.join(knowledgeDir(), `${scope}.md`);
}

export function settingsPath(): string {
  return path.join(claudeDir(), "settings.json");
}

export function skillDir(): string {
  return path.join(claudeDir(), "skills", "knowledge-update");
}

export function templatesRoot(): string {
  return path.resolve(__dirname, "..", "templates");
}

export function requireKnowledgeBase(): void {
  if (!fs.existsSync(knowledgeDir())) {
    console.error("No knowledge base found. Run: memex-md init");
    process.exit(1);
  }
}

export function isScope(value: string): value is Scope {
  return (VALID_SCOPES as readonly string[]).includes(value);
}
