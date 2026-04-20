# memex-md

> **让 Claude Code 拥有存在于你的代码仓库中的记忆,而不是用户目录里。**

[English](README.md) | [Español](README.es.md) | [Português (Brasil)](README.pt-BR.md) | [한국어](README.ko.md) | [日本語](README.ja.md) | [Русский](README.ru.md) | **简体中文** | [繁體中文](README.zh-TW.md)

<p align="center">
  <img src="./assets/memex-md-banner.png" alt="memex-md — 你的知识已被保留。现在 Claude Code 下次就会知道。" />
</p>

### 🛠 技术栈

![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-%E2%89%A518-339933?style=flat-square&logo=node.js&logoColor=white)
![npm](https://img.shields.io/badge/npm-CB3837?style=flat-square&logo=npm&logoColor=white)
![零运行时依赖](https://img.shields.io/badge/%E8%BF%90%E8%A1%8C%E6%97%B6%E4%BE%9D%E8%B5%96-0-success?style=flat-square)
![License: MIT](https://img.shields.io/badge/license-MIT-blue?style=flat-square)

---

## 🤔 问题

每次你启动一个新的 Claude Code 会话,Claude 都会忘记之前学到的大部分内容。于是你不得不一遍遍地重复解释同样的事情:

- ❌ *"我们本地用 SQLite,因为 Postgres 对开发机来说太重了。"*
- ❌ *"别动 `auth/legacy.ts` — 移动端 App 还在用。"*
- ❌ *"上次你修这个 bug 的时候,根因是缓存,不是 API。"*

Claude **确实**有记忆功能,但它存在你的用户目录里(`~/.claude/...`),不随仓库同步。队友、其他机器、CI 都要从零开始。

## ✨ 解决方案

`memex-md` 给你的仓库配上它自己的记忆。一条命令就会在仓库里建好一个文件夹,Claude 把学到的东西写进去,并在每次会话开始时读回来:

```bash
npx memex-md init
```

这会生成:

```
.claude/
  knowledge/
    architecture.md     ← 项目的整体形态
    decisions.md        ← 为什么我们选 X 而不是 Y
    patterns.md         ← 反复出现的代码模式
    gotchas.md          ← 坑、踩过的雷、历史 bug
    glossary.md         ← 项目内部术语
  skills/
    knowledge-update/   ← 告诉 Claude 什么时候该更新上面这些
  settings.json         ← 编辑后的提醒 + 会话开始时的过期检查
```

把这个目录提交到 git。Claude 每次会话都读它。就这样。

## 🚀 快速开始

```bash
# 在任何使用 Claude Code 的仓库里:
npm install --save-dev memex-md
npx memex-md init

# 提交新生成的 .claude/ 目录
git add .claude && git commit -m "Add memex-md"

# 添加你的第一条知识条目
npx memex-md add decisions "本地选 SQLite 而非 Postgres"
```

打开 `.claude/knowledge/decisions.md`,补充细节,提交。下次你启动 Claude 时,这条决定就已经在上下文里了。

## 🧰 命令

**核心命令**

| 命令 | 作用 |
|---|---|
| `memex-md init` | 创建 `.claude/knowledge/`、skill 和 hooks |
| `memex-md add <scope> "<标题>"` | 向某个 scope 追加一条新条目 |
| `memex-md list [scope]` | 查看知识库里有什么 |
| `memex-md search <查询>` | 在所有条目中搜索 |
| `memex-md validate` | 检查知识库是否完整 |
| `memex-md prune [--days N]` | 标记过期条目(默认 >180 天) |

**Claude 驱动的命令(需要 `claude` CLI 在 PATH 中)**

| 命令 | 作用 |
|---|---|
| `memex-md draft [--staged\|--working\|--commit <sha>] [--write]` | 让 Claude 根据 git diff 提议要写入知识库的条目 |
| `memex-md ask "<问题>"` | 向 Claude 提问,仅基于你的知识库作答 |

**自动化**

| 命令 | 作用 |
|---|---|
| `memex-md stale [--days N] [--brief]` | 列出过期条目(SessionStart hook 使用) |
| `memex-md check [--base <ref>] [--patterns <glob,glob>] [--strict]` | CI 检查:当敏感文件变更但知识库没有更新时失败 |

## 🤖 自动化,详解

依赖自觉的记忆最终会腐烂。`memex-md` 从四个方向关上这个缺口 —— 让你再也不用“记得去维护它”:

### `draft` —— 根据 diff 提议条目
```bash
# 基于你最近一次提交
npx memex-md draft

# 基于 staged 变更,并把提议直接写入文件
npx memex-md draft --staged --write
```
读取 diff,让 Claude 识别其中值得记录的内容(新决定、新模式、新的坑),要么打印提议,要么直接写入对应的 scope 文件。把 *"这个我应该记下来"* 变成一条命令级的反射动作。

### `ask` —— 不用 embeddings 的语义搜索
```bash
npx memex-md ask "为什么我们本地用 SQLite?"
```
加载 `.claude/knowledge/` 下的所有 `.md` 文件,交给 Claude 回答 —— 严格限定在知识库范围内,并标注引用来源。不用向量数据库,不用维护索引。语义匹配由 Claude 完成。

### SessionStart hook —— 每次会话启动时的过期检查
由 `init` 自动注册。在每次 Claude Code 会话开始时打印一行,标出超过 180 天的条目:
```
[memex-md] 3 knowledge entries older than 180 days — review for staleness: decisions.md:"Chose SQLite...", gotchas.md:"..."
```
没有过期时完全安静。给你一个轻推,不是一堵墙。

### `check` —— CI 风格的校验
```bash
# 在 GitHub Actions 或 pre-push hook 里:
npx memex-md check --base origin/main...HEAD --strict
```
当有人提交 migration / auth / schema / config 变更却没更新知识库时,让检查失败。`--patterns` 可以覆盖默认匹配规则。在 `--strict` 或 `CI=true` 时退出码为 `1`。

## 🗂 Scopes

每个 scope 对应一个 Markdown 文件。不是每一个都必须用 —— 哪个符合你刚学到的东西,就写哪个。

| Scope | 什么时候用 |
|---|---|
| 🏗 **architecture** | 你新增或改动了一个服务、模块或数据流 |
| 🎯 **decisions** | 你因为不显而易见的原因选了 X 而不是 Y |
| 🔁 **patterns** | 你注意到同一种代码结构出现了 3 次以上 |
| ⚠️ **gotchas** | 你修了一个根因很奇怪的 bug |
| 📖 **glossary** | 你用了一个只有你团队懂的术语 |

## 🧠 这个项目为什么存在(详细版)

Claude Code 已经有三种记住东西的方式,每一种都有真实的限制:

| 记忆类型 | 存在哪里 | 会丢什么 |
|---|---|---|
| 💬 **聊天历史**(`claude --continue`) | `~/.claude/projects/<slug>/` | 只是你过去的对话。新消息把旧细节挤出上下文后,它们就模糊了。 |
| 🧩 **自动记忆** | `~/.claude/projects/<slug>/memory/` | 只存在**一台机器**上。队友、CI、你的另一台笔记本全都是空白开始。无法在 PR 中审阅。 |
| 📄 **`CLAUDE.md`** | 仓库内 | 随代码同步 ✅ —— 但它是一个为“稳定规则”设计的单一文件,不适合承载几十条持续演化的决定、模式和坑。 |

`memex-md` 正好填上这个缺口:一个**在仓库内**、**按 scope 组织**、**会自我更新**的知识库。由 git 管理版本,在 PR 中可审,跨机器一致。

### 实际带来的改变

| 以前 | 之后 |
|---|---|
| *"我们本地为什么不用 Postgres?"* | 已经写在 `decisions.md` 里。Claude 已经知道。 |
| 同一个棘手 bug 被修了两次 | 已写入 `gotchas.md`,附带根因。 |
| 新队友要花一周才能上手 | 他们 `git clone`,Claude 已经懂项目的约定。 |
| 你的第二台机器像个陌生人 | 仓库是唯一事实来源,每台机器都一样。 |
| 大重构之后,Claude 要慢慢重新摸索 | `architecture.md` 是在重构*过程中*就更新的。 |

### 为什么这能让 Claude Code 更快

- **更少的重探索。** Claude 不用再反复读取已经学过的文件。
- **更小的有效上下文。** 一份聚焦的 200 行 `architecture.md`,胜过 4000 行老旧的聊天记录。
- **不怕遗忘。** 磁盘上的文件每次会话都会新鲜加载 —— 不会被压缩。
- **可审阅。** 糟糕的条目在 code review 里就会被拦下,而不是等它毁掉将来某次会话。

## 🛑 什么时候*不*该用

- 你在写一个一次性的脚本或只跑一次会话的小实验 —— 单独一个 `CLAUDE.md` 就够了。
- 你的整个代码库每次都能舒服地塞进 Claude 的上下文。
- 你不会跨多次会话或多台机器使用 Claude Code。

否则:它通常在一周之内就能回本。

## 📦 环境要求

- **Node.js** 18 或以上
- **Claude Code** —— [从这里安装](https://claude.com/claude-code)
- `draft` 和 `ask` 需要 `claude` CLI 存在于 `PATH`(或设置 `CLAUDE_MEMEX_CLAUDE_BIN`)
- `check` 需要 `git`,应在 git 仓库中运行(含 CI 环境)

## 🤝 贡献

欢迎 PR。详细的本地开发设置、PR 规范、翻译流程和 bug 报告方式,请看 [CONTRIBUTING.md](CONTRIBUTING.md)。

简要:

1. 每个 PR 聚焦一个 feature 或一个 bugfix。
2. push 前先跑 `npm run build`。
3. 如果你的改动引入了新的模式或决定,顺便在自己的 `.claude/knowledge/` 里加一条条目 —— 我们自己用自己的工具。

## 📄 许可证

MIT —— 详见 [LICENSE](LICENSE)。

---

<sub>这个名字来自 **memex** —— Vannevar Bush 在 1945 年构想的一种个人设备,能存下你所有的书、记录和通讯,随时即时检索。这是你项目的 memex。</sub>
