# claude-memex

> **Dale a Claude Code una memoria que viva en tu repositorio — no en tu carpeta personal.**

[English](README.md) | **Español** | [Português (Brasil)](README.pt-BR.md) | [한국어](README.ko.md) | [日本語](README.ja.md) | [Русский](README.ru.md) | [简体中文](README.zh-CN.md) | [繁體中文](README.zh-TW.md)

<p align="center">
  <img src="./assets/claude-memex-banner.png" alt="claude-memex — tu conocimiento ha sido retenido. Ahora Claude Code ya lo sabe la próxima vez." />
</p>

### 🛠 Construido con

![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-%E2%89%A518-339933?style=flat-square&logo=node.js&logoColor=white)
![npm](https://img.shields.io/badge/npm-CB3837?style=flat-square&logo=npm&logoColor=white)
![Cero dependencias](https://img.shields.io/badge/deps_en_ejecuci%C3%B3n-0-success?style=flat-square)
![Licencia: MIT](https://img.shields.io/badge/licencia-MIT-blue?style=flat-square)

---

## 🤔 El problema

Cada vez que inicias una nueva sesión de Claude Code, Claude olvida casi todo lo que había aprendido antes. Terminas explicando las mismas cosas una y otra vez:

- ❌ *"Usamos SQLite en local porque Postgres era demasiado pesado en los portátiles de desarrollo."*
- ❌ *"No toques `auth/legacy.ts` — todavía lo usa la app móvil."*
- ❌ *"La última vez que arreglaste este bug, la causa raíz era la caché, no la API."*

Claude **sí** tiene una función de memoria, pero se guarda en tu carpeta personal (`~/.claude/...`). No viaja con el repositorio. Compañeros de equipo, otras máquinas y CI empiezan todos sin nada.

## ✨ La solución

`claude-memex` le da a tu repositorio su propia memoria. Un comando configura una carpeta donde Claude anota lo que aprende — y la vuelve a leer al inicio de cada sesión:

```bash
npx claude-memex init
```

Esto crea:

```
.claude/
  knowledge/
    architecture.md     ← cómo luce el proyecto
    decisions.md        ← por qué elegimos X en vez de Y
    patterns.md         ← patrones de código que reutilizamos
    gotchas.md          ← trampas, bugs pasados
    glossary.md         ← nuestra jerga
  skills/
    knowledge-update/   ← le dice a Claude cuándo actualizar lo anterior
  settings.json         ← un recordatorio tras editar + chequeo al iniciar sesión
```

Haz commit de la carpeta. Claude la lee en cada sesión. Listo.

## 🚀 Inicio rápido

```bash
# En cualquier repositorio donde uses Claude Code:
npm install --save-dev claude-memex
npx claude-memex init

# Haz commit de la nueva carpeta .claude/
git add .claude && git commit -m "Add claude-memex"

# Agrega tu primera entrada
npx claude-memex add decisions "elegimos SQLite sobre Postgres para desarrollo local"
```

Abre `.claude/knowledge/decisions.md`, completa los detalles y haz commit. La próxima vez que inicies Claude, esa decisión ya está en el contexto.

## 🧰 Comandos

**Básicos**

| Comando | Qué hace |
|---|---|
| `claude-memex init` | Configura `.claude/knowledge/`, el skill y los hooks |
| `claude-memex add <scope> "<título>"` | Añade una entrada a un scope |
| `claude-memex list [scope]` | Muestra qué hay en tu base de conocimiento |
| `claude-memex search <consulta>` | Grep entre todas las entradas |
| `claude-memex validate` | Verifica que todo esté en orden |
| `claude-memex prune [--days N]` | Marca entradas viejas (por defecto: >180 días) |

**Impulsados por Claude (requieren el CLI de Claude Code en el PATH)**

| Comando | Qué hace |
|---|---|
| `claude-memex draft [--staged\|--working\|--commit <sha>] [--write]` | Pide a Claude proponer entradas a partir de un git diff |
| `claude-memex ask "<pregunta>"` | Hace una pregunta respondida estrictamente desde tu base de conocimiento |

**Automatización**

| Comando | Qué hace |
|---|---|
| `claude-memex stale [--days N] [--brief]` | Lista entradas obsoletas (alimenta el hook SessionStart) |
| `claude-memex check [--base <ref>] [--patterns <glob,glob>] [--strict]` | Chequeo CI: falla si se tocaron archivos sensibles sin actualizar la base de conocimiento |

## 🤖 La automatización, explicada

Una memoria que depende de la disciplina es una memoria que se deteriora. `claude-memex` cierra esa brecha de cuatro formas — para que nunca tengas que acordarte de mantenerla:

### `draft` — propone entradas a partir de un diff
```bash
# A partir de tu último commit
npx claude-memex draft

# A partir de cambios staged, escribiendo las entradas propuestas en los archivos
npx claude-memex draft --staged --write
```
Lee el diff, le pide a Claude identificar algo digno de registrar (nuevas decisiones, patrones, trampas) y o bien imprime las propuestas o las agrega directamente al archivo de scope adecuado. Convierte *"debería recordar esto"* en un reflejo de un solo comando.

### `ask` — búsqueda semántica sin embeddings
```bash
npx claude-memex ask "¿por qué elegimos SQLite en local?"
```
Carga cada `.md` de `.claude/knowledge/` y le pregunta a Claude — limitado estrictamente a la base de conocimiento, con citas de fuente. Sin base de datos vectorial, sin índice que mantener. Claude hace la coincidencia semántica.

### Hook SessionStart — chequeo de obsolescencia en cada sesión
Registrado automáticamente por `init`. Al iniciar cada sesión de Claude Code, imprime una línea que marca entradas con más de 180 días:
```
[claude-memex] 3 knowledge entries older than 180 days — review for staleness: decisions.md:"Chose SQLite...", gotchas.md:"..."
```
Silencioso cuando no hay nada obsoleto. Te da un empujoncito, no una pared de texto.

### `check` — validación al estilo CI
```bash
# En GitHub Actions o en un hook pre-push:
npx claude-memex check --base origin/main...HEAD --strict
```
Falla el chequeo cuando alguien introduce cambios de migración / auth / schema / config sin actualizar la base de conocimiento. La lista de patrones se puede sobrescribir con `--patterns`. Sale con código `1` cuando `--strict` está activo o cuando `CI=true`.

## 🗂 Scopes

Cada scope es un archivo Markdown. No necesitas todos — usa el que corresponda a lo que acabas de aprender.

| Scope | Úsalo cuando... |
|---|---|
| 🏗 **architecture** | Añadiste o cambiaste un servicio, módulo o flujo de datos |
| 🎯 **decisions** | Elegiste X sobre Y por una razón no obvia |
| 🔁 **patterns** | Notaste la misma forma de código 3+ veces |
| ⚠️ **gotchas** | Arreglaste un bug con una causa raíz rara |
| 📖 **glossary** | Usaste un término que solo tu equipo conoce |

## 🧠 Por qué existe esto (la versión larga)

Claude Code ya tiene tres formas de recordar cosas. Cada una tiene una limitación real:

| Tipo de memoria | Dónde vive | Qué pierde |
|---|---|---|
| 💬 **Historial de chat** (`claude --continue`) | `~/.claude/projects/<slug>/` | Es solo tu conversación pasada. Los detalles viejos se desvanecen cuando mensajes nuevos los sacan del contexto. |
| 🧩 **Auto-memoria** | `~/.claude/projects/<slug>/memory/` | Vive en **una máquina**. Compañeros de equipo, CI y tu otro portátil empiezan sin nada. No es revisable en PRs. |
| 📄 **`CLAUDE.md`** | En tu repositorio | Viaja con el código ✅ — pero es un único archivo pensado para reglas estables, no un archivo creciente de docenas de decisiones, patrones y trampas. |

`claude-memex` llena el hueco: una base de conocimiento **en el repositorio**, **organizada por scope** y **autoactualizada**. Versionada en git. Revisable en PRs. Igual en cada máquina.

### Qué cambia realmente

| Antes | Después |
|---|---|
| *"¿Por qué no usamos Postgres en local?"* | Está en `decisions.md`. Claude ya lo sabe. |
| El mismo bug complicado se arregla dos veces | Está en `gotchas.md` con la causa raíz. |
| Un nuevo compañero tarda una semana en ponerse al día | Hace `git clone`; Claude ya conoce las convenciones. |
| Tu segundo portátil se siente como un extraño | El repositorio es la fuente de verdad, en cada máquina. |
| Tras una refactorización grande, Claude reaprende la forma | `architecture.md` se actualizó *durante* la refactorización. |

### Por qué esto acelera a Claude Code

- **Menos re-exploración.** Claude gasta menos llamadas a herramientas releyendo archivos que ya aprendió.
- **Contexto efectivo más pequeño.** Un `architecture.md` enfocado de 200 líneas supera 4 000 líneas de historial de chat obsoleto.
- **Sobrevive al olvido.** Los archivos en disco se cargan frescos en cada sesión — no se compactan.
- **Revisable.** Las entradas malas se detectan en el code review, no después de que desvíen una sesión futura.

## 🛑 Cuándo *no* usar esto

- Estás escribiendo un script desechable o un spike de una sola sesión — `CLAUDE.md` solo basta.
- Todo tu código cabe cómodamente en el contexto de Claude cada vez.
- No usas Claude Code en múltiples sesiones ni máquinas.

De lo contrario: esto probablemente se paga solo en la primera semana.

## 📦 Requisitos

- **Node.js** 18 o superior
- **Claude Code** — [instálalo aquí](https://claude.com/claude-code)
- `draft` y `ask` requieren el CLI `claude` en tu `PATH` (o define `CLAUDE_MEMEX_CLAUDE_BIN`)
- `check` requiere `git` y está pensado para ejecutarse dentro de un repo git (incluido CI)

## 🤝 Contribuir

PRs bienvenidos. Por favor:

1. Cada PR enfocado en una sola feature o fix.
2. Ejecuta `npm run build` antes de hacer push.
3. Si tu cambio introduce un patrón o decisión nueva, añade una entrada en tu propio `.claude/knowledge/` — comemos de nuestra propia comida.

## 📄 Licencia

MIT.

---

<sub>Llamado así por el **memex** — la idea de 1945 de Vannevar Bush de un dispositivo personal que almacenaría todos tus libros, registros y comunicaciones para que pudieran recuperarse al instante. Este es el memex de tu proyecto.</sub>
