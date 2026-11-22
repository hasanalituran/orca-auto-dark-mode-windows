import type { OrcaWorkerApi } from 'orca/worker'
import * as fs from 'node:fs'
import * as path from 'node:path'
import * as os from 'node:os'

const STORAGE_KEY = 'mode'

// Fallback (Ayu) artifacts, used when a configured theme cannot be resolved.
const AYU_DARK_APP = "{\n  \"schemaVersion\": 1,\n  \"base\": \"dark\",\n  \"tokens\": {\n    \"--background\": \"#10141c\",\n    \"--editor-surface\": \"#10141c\",\n    \"--card\": \"#0b0e14\",\n    \"--popover\": \"#141821\",\n    \"--primary\": \"#e6b450\",\n    \"--secondary\": \"#1f242e\",\n    \"--muted\": \"#10141c\",\n    \"--accent\": \"#1e242f\",\n    \"--border\": \"#1b1f29\",\n    \"--input\": \"#5a637833\",\n    \"--sidebar\": \"#0d1017\",\n    \"--sidebar-border\": \"#1b1f29\",\n    \"--foreground\": \"#bfbdb6\",\n    \"--popover-foreground\": \"#798192\",\n    \"--primary-foreground\": \"#5d481c\",\n    \"--secondary-foreground\": \"#bfbdb6\",\n    \"--muted-foreground\": \"#767e8f\",\n    \"--ring\": \"#e6b450\",\n    \"--sidebar-primary-foreground\": \"#5d481c\"\n  },\n  \"tokenColors\": [\n    {\n      \"scope\": \"comment\",\n      \"settings\": {\n        \"foreground\": \"#5a6673\",\n        \"fontStyle\": \"italic\"\n      }\n    },\n    {\n      \"scope\": [\n        \"string\",\n        \"constant.other.symbol\",\n        \"entity.name.import\",\n        \"entity.name.package\",\n        \"entity.name.filename.find-in-files\"\n      ],\n      \"settings\": {\n        \"foreground\": \"#aad94c\"\n      }\n    },\n    {\n      \"scope\": [\n        \"string.regexp\",\n        \"constant.character\",\n        \"constant.other\",\n        \"entity.other.attribute-name.pseudo-class\"\n      ],\n      \"settings\": {\n        \"foreground\": \"#95e6cb\"\n      }\n    },\n    {\n      \"scope\": [\n        \"constant.numeric\",\n        \"constant.language\",\n        \"variable.parameter\",\n        \"meta.parameter\",\n        \"meta.diff\",\n        \"meta.diff.header\"\n      ],\n      \"settings\": {\n        \"foreground\": \"#d2a6ff\"\n      }\n    },\n    {\n      \"scope\": [\n        \"variable\",\n        \"variable.parameter.function-call\",\n        \"punctuation.section\",\n        \"meta.embedded\"\n      ],\n      \"settings\": {\n        \"foreground\": \"#bfbdb6\"\n      }\n    },\n    {\n      \"scope\": [\n        \"variable.member\",\n        \"support.function\",\n        \"support.macro\"\n      ],\n      \"settings\": {\n        \"foreground\": \"#f07178\"\n      }\n    },\n    {\n      \"scope\": \"variable.language\",\n      \"settings\": {\n        \"foreground\": \"#39bae6\",\n        \"fontStyle\": \"italic\"\n      }\n    },\n    {\n      \"scope\": [\n        \"storage\",\n        \"keyword\",\n        \"punctuation.definition.template-expression\",\n        \"punctuation.section.embedded\",\n        \"storage.type.function\",\n        \"constant.numeric.line-number.match\"\n      ],\n      \"settings\": {\n        \"foreground\": \"#ff8f40\"\n      }\n    },\n    {\n      \"scope\": [\n        \"keyword.operator\",\n        \"punctuation.accessor\"\n      ],\n      \"settings\": {\n        \"foreground\": \"#f29668\"\n      }\n    },\n    {\n      \"scope\": [\n        \"punctuation.separator\",\n        \"punctuation.terminator\"\n      ],\n      \"settings\": {\n        \"foreground\": \"#8b8b88\"\n      }\n    },\n    {\n      \"scope\": [\n        \"entity.other.inherited-class\",\n        \"entity.name.tag\",\n        \"meta.tag.sgml\",\n        \"support.type\",\n        \"support.class\",\n        \"markup.underline.link\",\n        \"string.other.link\",\n        \"markup.table\"\n      ],\n      \"settings\": {\n        \"foreground\": \"#39bae6\"\n      }\n    },\n    {\n      \"scope\": [\n        \"entity.name.function\",\n        \"variable.function\",\n        \"variable.annotation\",\n        \"meta.function-call.generic\",\n        \"support.function.go\",\n        \"entity.other.attribute-name\"\n      ],\n      \"settings\": {\n        \"foreground\": \"#ffb454\"\n      }\n    },\n    {\n      \"scope\": [\n        \"entity.name\",\n        \"support.class.component\"\n      ],\n      \"settings\": {\n        \"foreground\": \"#59c2ff\"\n      }\n    },\n    {\n      \"scope\": [\n        \"punctuation.definition.tag.end\",\n        \"punctuation.definition.tag.begin\",\n        \"punctuation.definition.tag\"\n      ],\n      \"settings\": {\n        \"foreground\": \"#286982\"\n      }\n    },\n    {\n      \"scope\": \"support.constant\",\n      \"settings\": {\n        \"foreground\": \"#f29668\",\n        \"fontStyle\": \"italic\"\n      }\n    },\n    {\n      \"scope\": [\n        \"storage.type.annotation\",\n        \"entity.name.function.decorator\",\n        \"markup.strike\"\n      ],\n      \"settings\": {\n        \"foreground\": \"#e6c08a\"\n      }\n    },\n    {\n      \"scope\": [\n        \"invalid\",\n        \"message.error\"\n      ],\n      \"settings\": {\n        \"foreground\": \"#d95757\"\n      }\n    },\n    {\n      \"scope\": \"support.type.property-name\",\n      \"settings\": {\n        \"foreground\": \"#39bae6\",\n        \"fontStyle\": \"\"\n      }\n    },\n    {\n      \"scope\": \"markup.heading\",\n      \"settings\": {\n        \"foreground\": \"#aad94c\",\n        \"fontStyle\": \"bold\"\n      }\n    },\n    {\n      \"scope\": [\n        \"markup.italic\",\n        \"emphasis\"\n      ],\n      \"settings\": {\n        \"foreground\": \"#f07178\",\n        \"fontStyle\": \"italic\"\n      }\n    },\n    {\n      \"scope\": \"markup.bold\",\n      \"settings\": {\n        \"foreground\": \"#f07178\",\n        \"fontStyle\": \"bold\"\n      }\n    },\n    {\n      \"scope\": \"markup.underline\",\n      \"settings\": {\n        \"fontStyle\": \"underline\"\n      }\n    },\n    {\n      \"scope\": \"meta.separator\",\n      \"settings\": {\n        \"foreground\": \"#5a6673\",\n        \"fontStyle\": \"bold\"\n      }\n    },\n    {\n      \"scope\": \"markup.quote\",\n      \"settings\": {\n        \"foreground\": \"#95e6cb\",\n        \"fontStyle\": \"italic\"\n      }\n    },\n    {\n      \"scope\": \"markup.inserted\",\n      \"settings\": {\n        \"foreground\": \"#70bf56\"\n      }\n    },\n    {\n      \"scope\": \"markup.changed\",\n      \"settings\": {\n        \"foreground\": \"#73b8ff\"\n      }\n    },\n    {\n      \"scope\": \"markup.deleted\",\n      \"settings\": {\n        \"foreground\": \"#f26d78\"\n      }\n    },\n    {\n      \"scope\": \"markup.strong\",\n      \"settings\": {\n        \"fontStyle\": \"bold\"\n      }\n    },\n    {\n      \"scope\": \"punctuation.definition.markdown\",\n      \"settings\": {\n        \"foreground\": \"#5a6673\"\n      }\n    }\n  ]\n}"
const AYU_LIGHT_APP = "{\n  \"schemaVersion\": 1,\n  \"base\": \"light\",\n  \"tokens\": {\n    \"--background\": \"#fcfcfc\",\n    \"--editor-surface\": \"#fcfcfc\",\n    \"--card\": \"#f4f6f7\",\n    \"--popover\": \"#fafafa\",\n    \"--primary\": \"#f29718\",\n    \"--secondary\": \"#e4e6e9\",\n    \"--muted\": \"#fcfcfc\",\n    \"--accent\": \"#e8eaed\",\n    \"--border\": \"#6b7d8f1f\",\n    \"--input\": \"#828e9f33\",\n    \"--sidebar\": \"#f8f9fa\",\n    \"--sidebar-border\": \"#6b7d8f1f\",\n    \"--foreground\": \"#5c6166\",\n    \"--popover-foreground\": \"#6b7482\",\n    \"--primary-foreground\": \"#5d3801\",\n    \"--secondary-foreground\": \"#5c6166\",\n    \"--muted-foreground\": \"#6b7482\",\n    \"--ring\": \"#f29718\",\n    \"--sidebar-primary-foreground\": \"#5d3801\"\n  },\n  \"tokenColors\": [\n    {\n      \"scope\": \"comment\",\n      \"settings\": {\n        \"foreground\": \"#909296\",\n        \"fontStyle\": \"italic\"\n      }\n    },\n    {\n      \"scope\": [\n        \"string\",\n        \"constant.other.symbol\",\n        \"entity.name.import\",\n        \"entity.name.package\",\n        \"entity.name.filename.find-in-files\"\n      ],\n      \"settings\": {\n        \"foreground\": \"#7b9e1b\"\n      }\n    },\n    {\n      \"scope\": [\n        \"string.regexp\",\n        \"constant.character\",\n        \"constant.other\",\n        \"entity.other.attribute-name.pseudo-class\"\n      ],\n      \"settings\": {\n        \"foreground\": \"#51a189\"\n      }\n    },\n    {\n      \"scope\": [\n        \"constant.numeric\",\n        \"constant.language\",\n        \"variable.parameter\",\n        \"meta.parameter\",\n        \"meta.diff\",\n        \"meta.diff.header\"\n      ],\n      \"settings\": {\n        \"foreground\": \"#a37acc\"\n      }\n    },\n    {\n      \"scope\": [\n        \"variable\",\n        \"variable.parameter.function-call\",\n        \"punctuation.section\",\n        \"meta.embedded\"\n      ],\n      \"settings\": {\n        \"foreground\": \"#5c6166\"\n      }\n    },\n    {\n      \"scope\": [\n        \"variable.member\",\n        \"support.function\",\n        \"support.macro\"\n      ],\n      \"settings\": {\n        \"foreground\": \"#e37070\"\n      }\n    },\n    {\n      \"scope\": \"variable.language\",\n      \"settings\": {\n        \"foreground\": \"#579cb4\",\n        \"fontStyle\": \"italic\"\n      }\n    },\n    {\n      \"scope\": [\n        \"storage\",\n        \"keyword\",\n        \"punctuation.definition.template-expression\",\n        \"punctuation.section.embedded\",\n        \"storage.type.function\",\n        \"constant.numeric.line-number.match\"\n      ],\n      \"settings\": {\n        \"foreground\": \"#d47c3e\"\n      }\n    },\n    {\n      \"scope\": [\n        \"keyword.operator\",\n        \"punctuation.accessor\"\n      ],\n      \"settings\": {\n        \"foreground\": \"#b68780\"\n      }\n    },\n    {\n      \"scope\": [\n        \"punctuation.separator\",\n        \"punctuation.terminator\"\n      ],\n      \"settings\": {\n        \"foreground\": \"#8c8f93\"\n      }\n    },\n    {\n      \"scope\": [\n        \"entity.other.inherited-class\",\n        \"entity.name.tag\",\n        \"meta.tag.sgml\",\n        \"support.type\",\n        \"support.class\",\n        \"markup.underline.link\",\n        \"string.other.link\",\n        \"markup.table\"\n      ],\n      \"settings\": {\n        \"foreground\": \"#579cb4\"\n      }\n    },\n    {\n      \"scope\": [\n        \"entity.name.function\",\n        \"variable.function\",\n        \"variable.annotation\",\n        \"meta.function-call.generic\",\n        \"support.function.go\",\n        \"entity.other.attribute-name\"\n      ],\n      \"settings\": {\n        \"foreground\": \"#b88c25\"\n      }\n    },\n    {\n      \"scope\": [\n        \"entity.name\",\n        \"support.class.component\"\n      ],\n      \"settings\": {\n        \"foreground\": \"#2a9bd5\"\n      }\n    },\n    {\n      \"scope\": [\n        \"punctuation.definition.tag.end\",\n        \"punctuation.definition.tag.begin\",\n        \"punctuation.definition.tag\"\n      ],\n      \"settings\": {\n        \"foreground\": \"#7e96a0\"\n      }\n    },\n    {\n      \"scope\": \"support.constant\",\n      \"settings\": {\n        \"foreground\": \"#b68780\",\n        \"fontStyle\": \"italic\"\n      }\n    },\n    {\n      \"scope\": [\n        \"storage.type.annotation\",\n        \"entity.name.function.decorator\",\n        \"markup.strike\"\n      ],\n      \"settings\": {\n        \"foreground\": \"#bf874e\"\n      }\n    },\n    {\n      \"scope\": [\n        \"invalid\",\n        \"message.error\"\n      ],\n      \"settings\": {\n        \"foreground\": \"#e65050\"\n      }\n    },\n    {\n      \"scope\": \"support.type.property-name\",\n      \"settings\": {\n        \"foreground\": \"#579cb4\",\n        \"fontStyle\": \"\"\n      }\n    },\n    {\n      \"scope\": \"markup.heading\",\n      \"settings\": {\n        \"foreground\": \"#7b9e1b\",\n        \"fontStyle\": \"bold\"\n      }\n    },\n    {\n      \"scope\": [\n        \"markup.italic\",\n        \"emphasis\"\n      ],\n      \"settings\": {\n        \"foreground\": \"#e37070\",\n        \"fontStyle\": \"italic\"\n      }\n    },\n    {\n      \"scope\": \"markup.bold\",\n      \"settings\": {\n        \"foreground\": \"#e37070\",\n        \"fontStyle\": \"bold\"\n      }\n    },\n    {\n      \"scope\": \"markup.underline\",\n      \"settings\": {\n        \"fontStyle\": \"underline\"\n      }\n    },\n    {\n      \"scope\": \"meta.separator\",\n      \"settings\": {\n        \"foreground\": \"#909296\",\n        \"fontStyle\": \"bold\"\n      }\n    },\n    {\n      \"scope\": \"markup.quote\",\n      \"settings\": {\n        \"foreground\": \"#51a189\",\n        \"fontStyle\": \"italic\"\n      }\n    },\n    {\n      \"scope\": \"markup.inserted\",\n      \"settings\": {\n        \"foreground\": \"#67a14e\"\n      }\n    },\n    {\n      \"scope\": \"markup.changed\",\n      \"settings\": {\n        \"foreground\": \"#478acc\"\n      }\n    },\n    {\n      \"scope\": \"markup.deleted\",\n      \"settings\": {\n        \"foreground\": \"#e0707d\"\n      }\n    },\n    {\n      \"scope\": \"markup.strong\",\n      \"settings\": {\n        \"fontStyle\": \"bold\"\n      }\n    },\n    {\n      \"scope\": \"punctuation.definition.markdown\",\n      \"settings\": {\n        \"foreground\": \"#909296\"\n      }\n    }\n  ]\n}"
const AYU_DARK_TERMINAL = "{\n  \"schemaVersion\": 1,\n  \"mode\": \"dark\",\n  \"terminal\": {\n    \"foreground\": \"#bfbdb6\",\n    \"background\": \"#0d1017\",\n    \"cursor\": \"#e6b450\",\n    \"selectionBackground\": \"#172e51\",\n    \"black\": \"#1b1f29\",\n    \"red\": \"#f06b73\",\n    \"green\": \"#70bf56\",\n    \"yellow\": \"#fdb04c\",\n    \"blue\": \"#4fbfff\",\n    \"magenta\": \"#d0a1ff\",\n    \"cyan\": \"#93e2c8\",\n    \"white\": \"#c7c7c7\",\n    \"brightBlack\": \"#686868\",\n    \"brightRed\": \"#f07178\",\n    \"brightGreen\": \"#aad94c\",\n    \"brightYellow\": \"#ffb454\",\n    \"brightBlue\": \"#59c2ff\",\n    \"brightMagenta\": \"#d2a6ff\",\n    \"brightCyan\": \"#95e6cb\",\n    \"brightWhite\": \"#ffffff\"\n  }\n}"
const AYU_LIGHT_TERMINAL = "{\n  \"schemaVersion\": 1,\n  \"mode\": \"light\",\n  \"terminal\": {\n    \"foreground\": \"#5c6166\",\n    \"background\": \"#f8f9fa\",\n    \"cursor\": \"#f29718\",\n    \"selectionBackground\": \"#d3e1f5\",\n    \"black\": \"#000000\",\n    \"red\": \"#f06b6c\",\n    \"green\": \"#6cbf43\",\n    \"yellow\": \"#e7a100\",\n    \"blue\": \"#21a1e2\",\n    \"magenta\": \"#a176cb\",\n    \"cyan\": \"#4abc96\",\n    \"white\": \"#c7c7c7\",\n    \"brightBlack\": \"#686868\",\n    \"brightRed\": \"#f07171\",\n    \"brightGreen\": \"#86b300\",\n    \"brightYellow\": \"#eba400\",\n    \"brightBlue\": \"#22a4e6\",\n    \"brightMagenta\": \"#a37acc\",\n    \"brightCyan\": \"#4cbf99\",\n    \"brightWhite\": \"#d1d1d1\"\n  }\n}"

function orcaUserDataDir(): string {
  if (process.platform === 'darwin') return path.join(os.homedir(), 'Library', 'Application Support', 'orca')
  if (process.platform === 'win32') return path.join(process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming'), 'orca')
  return path.join(process.env.XDG_CONFIG_HOME || path.join(os.homedir(), '.config'), 'orca')
}

function parseContentId(id: string): { pluginKey: string; themeId: string } | null {
  const m = String(id || '').match(/^plugin:(.+?)\/(.+)$/)
  if (!m) return null
  return { pluginKey: m[1], themeId: m[2] }
}

function findPluginDir(pluginKey: string): string | null {
  const base = path.join(orcaUserDataDir(), 'plugins', pluginKey)
  if (!fs.existsSync(base)) return null
  for (const entry of fs.readdirSync(base, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      const p = path.join(base, entry.name, 'orca-plugin.json')
      if (fs.existsSync(p)) return path.join(base, entry.name)
    }
  }
  return null
}

interface ResolvedTheme { app: string; terminal: string }

function resolveTheme(contentId: string): ResolvedTheme | null {
  const parsed = parseContentId(contentId)
  if (!parsed) return null
  const dir = findPluginDir(parsed.pluginKey)
  if (!dir) return null
  let manifest: any
  try { manifest = JSON.parse(fs.readFileSync(path.join(dir, 'orca-plugin.json'), 'utf8')) } catch { return null }
  const themeEntry = (manifest?.contributes?.themes || []).find((t: any) => t.id === parsed.themeId)
  const termEntry = (manifest?.contributes?.terminalThemes || []).find((t: any) => t.id === parsed.themeId)
  if (!themeEntry) return null
  try {
    const app = fs.readFileSync(path.join(dir, themeEntry.path), 'utf8')
    let terminal = ''
    if (termEntry) {
      terminal = fs.readFileSync(path.join(dir, termEntry.path), 'utf8')
    } else {
      // Minimal terminal fallback derived from app base
      const base = JSON.parse(app).base === 'light' ? 'light' : 'dark'
      terminal = JSON.stringify({ schemaVersion: 1, mode: base, terminal: { background: '#000000', foreground: '#ffffff', black: '#000000' } })
    }
    return { app, terminal }
  } catch {
    return null
  }
}

function listInstalledThemes(): string[] {
  const out: string[] = []
  const base = path.join(orcaUserDataDir(), 'plugins')
  if (!fs.existsSync(base)) return out
  for (const pluginEntry of fs.readdirSync(base, { withFileTypes: true })) {
    if (!pluginEntry.isDirectory()) continue
    const pluginKey = pluginEntry.name
    const pluginDir = findPluginDir(pluginKey)
    if (!pluginDir) continue
    try {
      const manifest = JSON.parse(fs.readFileSync(path.join(pluginDir, 'orca-plugin.json'), 'utf8'))
      for (const t of (manifest?.contributes?.themes || [])) {
        out.push(`plugin:${pluginKey}/${t.id}`)
      }
    } catch { /* ignore */ }
  }
  return out
}

export default function activate(orca: OrcaWorkerApi): void {
  async function currentMode(): Promise<'dark' | 'light'> {
    const value = await orca.storage.get(STORAGE_KEY)
    return value === 'dark' ? 'dark' : 'light'
  }

  async function configuredTheme(mode: 'dark' | 'light'): Promise<ResolvedTheme> {
    const key = mode === 'dark' ? 'darkTheme' : 'lightTheme'
    const id = (await orca.settings.get(key)) as string | undefined
    const resolved = id ? resolveTheme(id) : null
    if (resolved) return resolved
    // Fallback to a neutral palette approximating Orca's default theme
    return mode === 'dark'
      ? { app: NEUTRAL_DARK_APP, terminal: NEUTRAL_DARK_TERMINAL }
      : { app: NEUTRAL_LIGHT_APP, terminal: NEUTRAL_LIGHT_TERMINAL }
  }

  async function applyMode(mode: 'dark' | 'light'): Promise<void> {
    const revisionResult = (await orca.host.call('appearance.read')) as { revision: string }
    const { app, terminal } = await configuredTheme2(mode)
    await orca.host.call('appearance.apply', {
      expectedRevision: revisionResult.revision,
      app,
      terminal
    })
    await orca.storage.set(STORAGE_KEY, mode)
    await orca.host.call('statusBar.update', {
      id: 'toggle',
      text: mode === 'dark' ? 'Dark' : 'Light',
      icon: 'lightbulb'
    })
  }

  async function toggle(): Promise<'dark' | 'light'> {
    const mode = await currentMode()
    const next = mode === 'dark' ? 'light' : 'dark'
    await applyMode(next)
    return next
  }

  const LIGHT_KEY = 'lightTheme'
  const DARK_KEY = 'darkTheme'
  const DEFAULT_LIGHT = ''
  const DEFAULT_DARK = ''

  async function getConfig() {
    const light = (await orca.storage.get(LIGHT_KEY)) as string | null
    const dark = (await orca.storage.get(DARK_KEY)) as string | null
    return { light: light || DEFAULT_LIGHT, dark: dark || DEFAULT_DARK }
  }

  async function setConfig(input: { light?: string; dark?: string }) {
    if (input.light !== undefined) await orca.storage.set(LIGHT_KEY, input.light)
    if (input.dark !== undefined) await orca.storage.set(DARK_KEY, input.dark)
    const cfg = await getConfig()
    orca.panels.post('config.changed', { light: cfg.light, dark: cfg.dark })
    return cfg
  }

  orca.commands.register('toggle', async () => toggle())
  orca.commands.register('list-themes', async () => {
    const themes = listInstalledThemes()
    console.log('[toggle-theme] Installed themes:')
    for (const t of themes) console.log('  ' + t)
    return themes
  })

  orca.panels.handle('themes.list', async () => ({ themes: listInstalledThemes() }))
  orca.panels.handle('config.get', async () => getConfig())
  orca.panels.handle('config.set', async (input: any) => setConfig(input || {}))
  orca.panels.handle('apply', async (input: any) => { await applyMode(input?.mode === 'dark' ? 'dark' : 'light'); return { mode: input?.mode === 'dark' ? 'dark' : 'light' } })
  orca.panels.handle('toggle', async () => ({ mode: await toggle() }))

  // Also resolve configured themes in configuredTheme()
  const origConfigured = configuredTheme
  // override configuredTheme to use settings storage
  async function configuredTheme2(mode: 'dark' | 'light'): Promise<{ app: string; terminal: string }> {
    const cfg = await getConfig()
    const id = mode === 'dark' ? cfg.dark : cfg.light
    const resolved = resolveTheme(id)
    if (resolved) return resolved
    return mode === 'dark'
      ? { app: AYU_DARK_APP, terminal: AYU_DARK_TERMINAL }
      : { app: AYU_LIGHT_APP, terminal: AYU_LIGHT_TERMINAL }
  }
  // monkeypatch by reassigning not possible; instead call configuredTheme2 in applyMode
  // We'll just modify applyMode below via edit


  void currentMode().then((mode) => {
    void orca.host.call('statusBar.update', {
      id: 'toggle',
      text: mode === 'dark' ? 'Dark' : 'Light',
      icon: 'lightbulb'
    })
  })
}