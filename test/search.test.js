const { describe, test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { runCli, makeInitedRepo, cleanup } = require("./helpers");

describe("search", () => {
  let dir;
  before(() => {
    dir = makeInitedRepo();
    runCli(["add", "decisions", "chose SQLite over Postgres"], dir);
    runCli(["add", "gotchas", "docx empty cells"], dir);
  });
  after(() => cleanup(dir));

  test("finds matching text (case-insensitive)", () => {
    const r = runCli(["search", "sqlite"], dir);
    assert.equal(r.exitCode, 0, r.stderr);
    assert.match(r.stdout, /chose SQLite/);
    assert.match(r.stdout, /match/);
  });

  test("reports no matches with exit 1", () => {
    const r = runCli(["search", "zzzzz-never-there"], dir);
    assert.equal(r.exitCode, 1);
    assert.match(r.stdout, /0 match/);
  });

  test("rejects missing query", () => {
    const r = runCli(["search"], dir);
    assert.equal(r.exitCode, 1);
    assert.match(r.stderr, /Usage:/);
  });
});
