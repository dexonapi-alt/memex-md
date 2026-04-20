const { describe, test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { runCli, makeInitedRepo, cleanup } = require("./helpers");

describe("list", () => {
  let dir;
  before(() => {
    dir = makeInitedRepo();
  });
  after(() => cleanup(dir));

  test("empty knowledge base reports zero entries per scope", () => {
    const r = runCli(["list"], dir);
    assert.equal(r.exitCode, 0, r.stderr);
    assert.match(r.stdout, /decisions\.md \(0 entries\)/);
    assert.match(r.stdout, /gotchas\.md \(0 entries\)/);
  });

  test("shows entries after add", () => {
    runCli(["add", "decisions", "first one"], dir);
    runCli(["add", "decisions", "second one"], dir);
    const r = runCli(["list", "decisions"], dir);
    assert.equal(r.exitCode, 0);
    assert.match(r.stdout, /first one/);
    assert.match(r.stdout, /second one/);
    assert.match(r.stdout, /decisions\.md \(2 entries\)/);
  });

  test("rejects invalid scope", () => {
    const r = runCli(["list", "bogus"], dir);
    assert.equal(r.exitCode, 1);
    assert.match(r.stderr, /Invalid scope/);
  });
});
