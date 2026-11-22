import * as fs from 'node:fs'
import * as path from 'node:path'
import * as os from 'node:os'

export function orcaUserDataDir(home = os.homedir(), platform = process.platform, env = process.env): string {
  if (platform === 'darwin') return path.join(home, 'Library', 'Application Support', 'orca')
  if (platform === 'win32') return path.join(env.APPDATA || path.join(home, 'AppData', 'Roaming'), 'orca')
  return path.join(env.XDG_CONFIG_HOME || path.join(home, '.config'), 'orca')
}

export function parseContentId(id: string): { pluginKey: string; themeId: string } | null {
  const m = String(id || '').match(/^plugin:(.+?)\/(.+)$/)
  if (!m) return null
  return { pluginKey: m[1], themeId: m[2] }
}

export function findPluginDir(baseDir: string, pluginKey: string): string | null {
  const base = path.join(baseDir, 'plugins', pluginKey)
  if (!fs.existsSync(base)) return null
  for (const entry of fs.readdirSync(base, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      const p = path.join(base, entry.name, 'orca-plugin.json')
      if (fs.existsSync(p)) return path.join(base, entry.name)
    }
  }
  return null
}

export interface ResolvedTheme { app: string; terminal: string }

export function resolveTheme(baseDir: string, contentId: string): ResolvedTheme | null {
  const parsed = parseContentId(contentId)
  if (!parsed) return null
  const dir = findPluginDir(baseDir, parsed.pluginKey)
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
      const base = JSON.parse(app).base === 'light' ? 'light' : 'dark'
      terminal = JSON.stringify({ schemaVersion: 1, mode: base, terminal: { background: '#000000', foreground: '#ffffff', black: '#000000' } })
    }
    return { app, terminal }
  } catch {
    return null
  }
}

export function listInstalledThemes(baseDir: string): string[] {
  const out: string[] = []
  const base = path.join(baseDir, 'plugins')
  if (!fs.existsSync(base)) return out
  for (const pluginEntry of fs.readdirSync(base, { withFileTypes: true })) {
    if (!pluginEntry.isDirectory()) continue
    const pluginKey = pluginEntry.name
    const pluginDir = findPluginDir(baseDir, pluginKey)
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