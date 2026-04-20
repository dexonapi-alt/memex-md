import { spawn, spawnSync, SpawnOptions } from "node:child_process";

export interface RunResult {
  stdout: string;
  stderr: string;
  exitCode: number;
}

function claudeBin(): string {
  if (process.env.CLAUDE_MEMEX_CLAUDE_BIN) {
    return process.env.CLAUDE_MEMEX_CLAUDE_BIN;
  }
  return process.platform === "win32" ? "claude.cmd" : "claude";
}

export interface ClaudeOptions {
  stream?: boolean;
  signal?: AbortSignal;
}

export function runClaudePrompt(
  prompt: string,
  opts: ClaudeOptions = {}
): Promise<string> {
  const bin = claudeBin();
  const stream = opts.stream ?? true;

  return new Promise((resolve, reject) => {
    const child = spawn(bin, ["-p", prompt], {
      stdio: ["ignore", "pipe", "pipe"],
      signal: opts.signal,
    });

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk: Buffer) => {
      const s = chunk.toString();
      stdout += s;
      if (stream) process.stdout.write(chunk);
    });

    child.stderr.on("data", (chunk: Buffer) => {
      stderr += chunk.toString();
    });

    child.on("error", (err: NodeJS.ErrnoException) => {
      if (err.code === "ENOENT") {
        reject(
          new Error(
            `Claude Code CLI not found (tried "${bin}"). ` +
              `Install from https://claude.com/claude-code and ensure it is on PATH. ` +
              `Or set CLAUDE_MEMEX_CLAUDE_BIN=/path/to/claude.`
          )
        );
      } else {
        reject(err);
      }
    });

    child.on("close", (code) => {
      if (code === 0) resolve(stdout);
      else reject(new Error(`claude exited with code ${code}\n${stderr.trim()}`));
    });
  });
}

export function runSync(
  cmd: string,
  args: string[],
  opts: SpawnOptions = {}
): RunResult {
  const result = spawnSync(cmd, args, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    ...opts,
  });
  return {
    stdout: (result.stdout ?? "").toString(),
    stderr: (result.stderr ?? "").toString(),
    exitCode: result.status ?? -1,
  };
}
