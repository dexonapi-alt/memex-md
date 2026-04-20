# Contributing to memex-md

Thanks for your interest in contributing. This project is a small, focused CLI — we try to keep it that way.

## Getting started

```bash
git clone https://github.com/dexonapi-alt/claude-memex.git
cd memex-md
npm install
npm run build
```

Run the CLI from the build:

```bash
node bin/memex-md.js help
```

Test in a scratch project:

```bash
npm pack
cd /tmp && mkdir scratch && cd scratch && git init -q
npm init -y
npm install /path/to/memex-md-<version>.tgz
npx memex-md init
```

## Pull requests

Please:

1. **Keep PRs focused** — one feature or one bug fix per PR.
2. **Run `npm run build` before pushing** — TypeScript errors must not land on `main`.
3. **Update the README** if your change is user-visible (new command, new flag, behaviour change). If the English README is updated, also note the divergence in `README.<lang>.md` files so translators can catch up.
4. **Eat your own dogfood** — if your change introduces a pattern, decision, or gotcha, add an entry to `.claude/knowledge/` in the same PR.
5. **Write commit messages that explain *why*, not just *what*** — the diff already shows the *what*.

## Translations

The README is available in several languages as `README.<lang>.md` files at the repo root.

- **Improve an existing translation**: edit the relevant `README.<lang>.md`.
- **Add a new language**: copy an existing translation as a template, replace the content, and add your language to the language switcher at the top of every existing README file.
- **Complete a stub**: the following translations are currently stubs — Korean (`README.ko.md`), Japanese (`README.ja.md`), Russian (`README.ru.md`), Traditional Chinese (`README.zh-TW.md`). PRs from native speakers are very welcome.

When the English README changes, translations drift. It's fine to land an English-only change and follow up with translation PRs — just mention the drift in the PR description.

## Reporting bugs

Open an issue at https://github.com/dexonapi-alt/claude-memex/issues with:

- `node --version`
- `claude --version`
- Your OS
- The exact command that failed and its full output
- A minimal reproducer when possible

## Code of conduct

Be kind. Assume good faith. Disagreement is fine; disrespect is not. Full text: [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md). Report issues to **joy@doctorsstudio.com**.

## License

By contributing you agree that your contributions will be licensed under the project's [MIT License](LICENSE).
