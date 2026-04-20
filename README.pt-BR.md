# claude-memex

> **Dê ao Claude Code uma memória que vive no seu repositório — não na sua pasta pessoal.**

[English](README.md) | [Español](README.es.md) | **Português (Brasil)** | [한국어](README.ko.md) | [日本語](README.ja.md) | [Русский](README.ru.md) | [简体中文](README.zh-CN.md) | [繁體中文](README.zh-TW.md)

<p align="center">
  <img src="./assets/claude-memex-banner.png" alt="claude-memex — seu conhecimento foi preservado. Agora o Claude Code já sabe disso na próxima vez." />
</p>

### 🛠 Construído com

![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-%E2%89%A518-339933?style=flat-square&logo=node.js&logoColor=white)
![npm](https://img.shields.io/badge/npm-CB3837?style=flat-square&logo=npm&logoColor=white)
![Zero dependências](https://img.shields.io/badge/deps_em_runtime-0-success?style=flat-square)
![Licença: MIT](https://img.shields.io/badge/licen%C3%A7a-MIT-blue?style=flat-square)

---

## 🤔 O problema

Toda vez que você inicia uma nova sessão do Claude Code, o Claude esquece quase tudo que aprendeu antes. Você acaba reexplicando as mesmas coisas:

- ❌ *"A gente usa SQLite local porque Postgres era pesado demais nos notebooks de desenvolvimento."*
- ❌ *"Não mexa em `auth/legacy.ts` — o app mobile ainda usa isso."*
- ❌ *"Da última vez que você corrigiu esse bug, a causa raiz era o cache, não a API."*

O Claude **tem** um recurso de memória — mas ele fica guardado na sua pasta pessoal (`~/.claude/...`). Ele não viaja com o repositório. Colegas de equipe, outras máquinas e CI começam todos do zero.

## ✨ A solução

O `claude-memex` dá ao seu repositório uma memória própria. Um comando cria uma pasta onde o Claude anota o que aprende — e relê no início de cada sessão:

```bash
npx claude-memex init
```

Isso cria:

```
.claude/
  knowledge/
    architecture.md     ← como o projeto é estruturado
    decisions.md        ← por que escolhemos X em vez de Y
    patterns.md         ← padrões de código que reutilizamos
    gotchas.md          ← armadilhas, bugs anteriores
    glossary.md         ← nosso jargão
  skills/
    knowledge-update/   ← diz ao Claude quando atualizar o que está acima
  settings.json         ← lembrete pós-edição + verificação no início da sessão
```

Faça commit da pasta. O Claude lê ela toda sessão. Só isso.

## 🚀 Início rápido

```bash
# Em qualquer repositório onde você use o Claude Code:
npm install --save-dev claude-memex
npx claude-memex init

# Faça commit da nova pasta .claude/
git add .claude && git commit -m "Add claude-memex"

# Adicione sua primeira entrada
npx claude-memex add decisions "escolhemos SQLite em vez de Postgres para desenvolvimento local"
```

Abra `.claude/knowledge/decisions.md`, preencha os detalhes e faça commit. Na próxima vez que você iniciar o Claude, essa decisão já estará no contexto.

## 🧰 Comandos

**Básicos**

| Comando | O que faz |
|---|---|
| `claude-memex init` | Configura `.claude/knowledge/`, o skill e os hooks |
| `claude-memex add <escopo> "<título>"` | Adiciona uma nova entrada a um escopo |
| `claude-memex list [escopo]` | Mostra o que tem na sua base de conhecimento |
| `claude-memex search <consulta>` | Grep em todas as entradas |
| `claude-memex validate` | Confere se tudo está em ordem |
| `claude-memex prune [--days N]` | Sinaliza entradas antigas (padrão: >180 dias) |

**Usando o Claude (requer o CLI do Claude Code no PATH)**

| Comando | O que faz |
|---|---|
| `claude-memex draft [--staged\|--working\|--commit <sha>] [--write]` | Pede ao Claude para propor entradas a partir de um git diff |
| `claude-memex ask "<pergunta>"` | Faz uma pergunta respondida estritamente com base na sua base de conhecimento |

**Automação**

| Comando | O que faz |
|---|---|
| `claude-memex stale [--days N] [--brief]` | Lista entradas desatualizadas (alimenta o hook SessionStart) |
| `claude-memex check [--base <ref>] [--patterns <glob,glob>] [--strict]` | Checagem de CI: falha se arquivos sensíveis foram alterados sem atualizar a base de conhecimento |

## 🤖 A automação, explicada

Uma memória que depende de disciplina é uma memória que se deteriora. O `claude-memex` fecha essa lacuna de quatro formas — para você nunca precisar lembrar de mantê-la:

### `draft` — propõe entradas a partir de um diff
```bash
# A partir do seu último commit
npx claude-memex draft

# A partir de mudanças staged, gravando as entradas propostas nos arquivos
npx claude-memex draft --staged --write
```
Lê o diff, pede ao Claude para identificar algo que valha a pena registrar (novas decisões, padrões, armadilhas) e ou imprime as propostas ou as anexa diretamente ao arquivo de escopo correto. Transforma *"preciso lembrar disso"* num reflexo de um comando só.

### `ask` — busca semântica sem embeddings
```bash
npx claude-memex ask "por que escolhemos SQLite local?"
```
Carrega todo `.md` em `.claude/knowledge/` e faz a pergunta ao Claude — restrito estritamente à base de conhecimento, com citações da fonte. Sem banco vetorial, sem índice para manter. O Claude faz a correspondência semântica.

### Hook SessionStart — checagem de entradas antigas a cada sessão
Registrado automaticamente pelo `init`. A cada início de sessão do Claude Code, imprime uma linha sinalizando entradas com mais de 180 dias:
```
[claude-memex] 3 knowledge entries older than 180 days — review for staleness: decisions.md:"Chose SQLite...", gotchas.md:"..."
```
Silencioso quando nada está desatualizado. Te dá um empurrãozinho, não uma parede de texto.

### `check` — validação estilo CI
```bash
# No GitHub Actions ou num hook pre-push:
npx claude-memex check --base origin/main...HEAD --strict
```
Falha a checagem quando alguém comita uma mudança de migration / auth / schema / config sem atualizar a base de conhecimento. A lista de padrões pode ser sobrescrita via `--patterns`. Retorna código `1` com `--strict` ou quando `CI=true`.

## 🗂 Escopos

Cada escopo é um arquivo Markdown. Você não precisa de todos — use o que combinar com o que você acabou de aprender.

| Escopo | Use quando... |
|---|---|
| 🏗 **architecture** | Você adicionou ou mudou um serviço, módulo ou fluxo de dados |
| 🎯 **decisions** | Você escolheu X em vez de Y por um motivo não óbvio |
| 🔁 **patterns** | Você notou a mesma forma de código 3 ou mais vezes |
| ⚠️ **gotchas** | Você corrigiu um bug com causa raiz estranha |
| 📖 **glossary** | Você usou um termo que só sua equipe conhece |

## 🧠 Por que isso existe (a versão longa)

O Claude Code já tem três formas de lembrar coisas. Cada uma tem uma limitação real:

| Tipo de memória | Onde vive | O que perde |
|---|---|---|
| 💬 **Histórico de chat** (`claude --continue`) | `~/.claude/projects/<slug>/` | É só sua conversa passada. Detalhes antigos somem quando mensagens novas os empurram para fora do contexto. |
| 🧩 **Auto-memória** | `~/.claude/projects/<slug>/memory/` | Vive em **uma máquina**. Colegas de equipe, CI e seu outro notebook começam do zero. Não é revisável em PRs. |
| 📄 **`CLAUDE.md`** | No seu repositório | Viaja com o código ✅ — mas é um único arquivo pensado para regras estáveis, não um arquivo crescente com dezenas de decisões, padrões e armadilhas. |

O `claude-memex` preenche essa lacuna: uma base de conhecimento **no repositório**, **organizada por escopo** e **autoatualizável**. Versionada no git. Revisável em PRs. Igual em toda máquina.

### O que realmente muda

| Antes | Depois |
|---|---|
| *"Por que a gente não usa Postgres local?"* | Está em `decisions.md`. O Claude já sabe. |
| O mesmo bug complicado é corrigido duas vezes | Está em `gotchas.md` com a causa raiz. |
| Um novo colega leva uma semana para entrar no ritmo | Ele faz `git clone`; o Claude já conhece as convenções. |
| Seu segundo notebook parece um estranho | O repositório é a fonte da verdade, em toda máquina. |
| Depois de uma grande refatoração, o Claude redescobre a forma aos poucos | `architecture.md` foi atualizado *durante* a refatoração. |

### Por que isso deixa o Claude Code mais rápido

- **Menos reexploração.** O Claude gasta menos chamadas de ferramenta relendo arquivos que já aprendeu.
- **Contexto efetivo menor.** Um `architecture.md` focado de 200 linhas supera 4 000 linhas de histórico de chat defasado.
- **Sobrevive ao esquecimento.** Arquivos em disco são carregados frescos a cada sessão — não são compactados.
- **Revisável.** Entradas ruins são pegas no code review, não depois de atrapalhar uma sessão futura.

## 🛑 Quando *não* usar isso

- Você está escrevendo um script descartável ou um spike de uma sessão só — `CLAUDE.md` sozinho basta.
- Todo o seu código cabe confortavelmente no contexto do Claude toda vez.
- Você não usa o Claude Code em várias sessões ou máquinas.

Caso contrário: isso provavelmente se paga na primeira semana.

## 📦 Requisitos

- **Node.js** 18 ou mais recente
- **Claude Code** — [instale aqui](https://claude.com/claude-code)
- `draft` e `ask` precisam do CLI `claude` no seu `PATH` (ou defina `CLAUDE_MEMEX_CLAUDE_BIN`)
- `check` precisa de `git` e é feito para rodar dentro de um repositório git (inclusive em CI)

## 🤝 Contribuindo

PRs são bem-vindos. Veja [CONTRIBUTING.md](CONTRIBUTING.md) para setup, guidelines de PR, fluxo de tradução e como reportar bugs.

Resumo:

1. Cada PR focado em uma feature ou bugfix.
2. Rode `npm run build` antes de push.
3. Se sua mudança introduz um padrão ou decisão nova, adicione uma entrada no seu próprio `.claude/knowledge/` — a gente come a própria comida.

## 📄 Licença

MIT — veja [LICENSE](LICENSE).

---

<sub>O nome vem do **memex** — a ideia de 1945 de Vannevar Bush sobre um dispositivo pessoal que armazenaria todos os seus livros, registros e comunicações para que pudessem ser recuperados instantaneamente. Esse é o memex do seu projeto.</sub>
