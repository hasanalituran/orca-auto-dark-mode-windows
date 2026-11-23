// Generates the "Orca built-in" light/dark app + terminal theme constants
// for src/worker.ts from the locally installed Orca app bundle.
//
// Usage:
//   node scripts/sync-orca-palette.mjs           print the TS constants block
//   node scripts/sync-orca-palette.mjs --write    rewrite the marked block in src/worker.ts
//
// Re-run whenever Orca's built-in palette changes so "Use Orca defaults"
// stays pixel-identical to Orca's own light/dark themes.

import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'

const require = createRequire(import.meta.url)
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')

const RESOURCES =
  process.env.ORCA_RESOURCES ||
  '/Applications/Orca.app/Contents/Resources/app.asar.unpacked/out'

const ASSETS = path.join(RESOURCES, 'renderer', 'assets')

function findOne(dir, re, label) {
  const hit = fs.readdirSync(dir).find((f) => re.test(f))
  if (!hit) throw new Error(`missing ${label} in ${dir}`)
  return path.join(dir, hit)
}

// --- app chrome tokens from the compiled CSS ---
function parseCssTokens(cssText, selector) {
  // Collect every flat `<selector>{ ... }` block and merge its --custom props.
  // Handles both ":root" and ".dark" as they appear minified in the bundle.
  const out = {}
  const blockRe = new RegExp(`${selector}\\s*{([^}]*)}`, 'g')
  let m
  while ((m = blockRe.exec(cssText))) {
    const body = m[1]
    const propRe = /(--[a-zA-Z0-9-]+)\s*:\s*([^;]+)/g
    let p
    while ((p = propRe.exec(body))) {
      out[p[1].trim()] = p[2].trim()
    }
  }
  return out
}

// --- terminal palettes ---
function loadTerminalThemes() {
  const file = findOne(
    path.join(RESOURCES, 'shared', 'terminal-themes'),
    /^defaults\.js$/,
    'terminal defaults.js'
  )
  delete require.cache[require.resolve(file)]
  return require(file).DEFAULT_TERMINAL_THEMES
}

// --- monaco editor token colors (VS Code Light+/Dark+) ---
function loadMonacoTheme(name) {
  const file = findOne(ASSETS, new RegExp(`^${name}-.*\\.js$`), `${name} monaco theme`)
  const src = fs.readFileSync(file, 'utf8')
  const m = src.match(/JSON\.parse\(`([\s\S]*)`\)/)
  if (!m) throw new Error(`could not parse ${file}`)
  return JSON.parse(m[1])
}

function toTerminalJson(palette, mode) {
  const pick = (k) => palette[k]
  return {
    schemaVersion: 1,
    mode,
    terminal: {
      foreground: pick('foreground'),
      background: pick('background'),
      cursor: pick('cursor'),
      selectionBackground: pick('selectionBackground'),
      black: pick('black'),
      red: pick('red'),
      green: pick('green'),
      yellow: pick('yellow'),
      blue: pick('blue'),
      magenta: pick('magenta'),
      cyan: pick('cyan'),
      white: pick('white'),
      brightBlack: pick('brightBlack'),
      brightRed: pick('brightRed'),
      brightGreen: pick('brightGreen'),
      brightYellow: pick('brightYellow'),
      brightBlue: pick('brightBlue'),
      brightMagenta: pick('brightMagenta'),
      brightCyan: pick('brightCyan'),
      brightWhite: pick('brightWhite'),
    },
  }
}

// The token keys the plugin app-theme schema understands (mirrors Orca's
// --custom properties that map to theme tokens).
const APP_TOKEN_KEYS = [
  '--background',
  '--editor-surface',
  '--foreground',
  '--card',
  '--card-foreground',
  '--popover',
  '--popover-foreground',
  '--primary',
  '--primary-foreground',
  '--secondary',
  '--secondary-foreground',
  '--muted',
  '--muted-foreground',
  '--accent',
  '--accent-foreground',
  '--border',
  '--input',
  '--ring',
  '--sidebar',
  '--sidebar-foreground',
  '--sidebar-primary',
  '--sidebar-primary-foreground',
  '--sidebar-accent',
  '--sidebar-accent-foreground',
  '--sidebar-border',
  '--sidebar-ring',
  '--worktree-sidebar',
  '--worktree-sidebar-foreground',
  '--worktree-sidebar-accent',
  '--worktree-sidebar-accent-foreground',
  '--worktree-sidebar-border',
  '--worktree-sidebar-ring',
  '--destructive',
  '--destructive-foreground',
  '--callout-note',
  '--callout-important',
]

function buildAppTheme(tokens, monaco, base) {
  const outTokens = {}
  for (const k of APP_TOKEN_KEYS) {
    if (tokens[k]) outTokens[k] = tokens[k]
  }
  const tokenColors = (monaco.tokenColors || []).map((r) => ({
    scope: r.scope,
    settings: r.settings,
  }))
  return { schemaVersion: 1, base, tokens: outTokens, tokenColors }
}

function jsString(obj) {
  return JSON.stringify(obj, null, 2)
}

function main() {
  const cssFile = findOne(ASSETS, /^client-.*\.css$/, 'client css')
  const css = fs.readFileSync(cssFile, 'utf8')
  const lightTokens = parseCssTokens(css, ':root')
  const darkTokens = parseCssTokens(css, '\\.dark')

  const terms = loadTerminalThemes()
  const darkTerm = terms['Ghostty Default Style Dark']
  const lightTerm = terms['Builtin Tango Light']

  const darkMonaco = loadMonacoTheme('dark-plus')
  const lightMonaco = loadMonacoTheme('light-plus')

  const lightApp = buildAppTheme(lightTokens, lightMonaco, 'light')
  const darkApp = buildAppTheme(darkTokens, darkMonaco, 'dark')
  const lightTermJson = toTerminalJson(lightTerm, 'light')
  const darkTermJson = toTerminalJson(darkTerm, 'dark')

  console.log('css file:', cssFile)
  console.log('light token count:', Object.keys(lightApp.tokens).length)
  console.log('dark token count:', Object.keys(darkApp.tokens).length)
  console.log('light token sample:', JSON.stringify(lightApp.tokens, null, 0).slice(0, 200))
  console.log('dark token sample:', JSON.stringify(darkApp.tokens, null, 0).slice(0, 200))
  console.log('dark monaco rules:', darkApp.tokenColors.length)
  console.log('light monaco rules:', lightApp.tokenColors.length)
  console.log('dark term sample:', JSON.stringify(darkTermJson).slice(0, 160))

  const block = `// ---- Orca built-in palette (generated; run scripts/sync-orca-palette.mjs) ----
const ORCA_BUILTIN_DARK_APP = ${JSON.stringify(jsString(darkApp))}
const ORCA_BUILTIN_LIGHT_APP = ${JSON.stringify(jsString(lightApp))}
const ORCA_BUILTIN_DARK_TERMINAL = ${JSON.stringify(jsString(darkTermJson))}
const ORCA_BUILTIN_LIGHT_TERMINAL = ${JSON.stringify(jsString(lightTermJson))}
// ---- end Orca built-in palette ----`

  if (process.argv.includes('--write')) {
    const workerPath = path.join(ROOT, 'src', 'worker.ts')
    let src = fs.readFileSync(workerPath, 'utf8')
    const markerRe = /\/\/ ---- Orca built-in palette[\s\S]*?\/\/ ---- end Orca built-in palette ----/
    // First run: replace the old Ayu fallback block (comment line up to the
    // line before `function orcaUserDataDir`).
    const ayuRe = /\/\/ Fallback \(Ayu\)[^\n]*\n[\s\S]*?\n(?=function orcaUserDataDir)/
    if (markerRe.test(src)) {
      src = src.replace(markerRe, block)
    } else if (ayuRe.test(src)) {
      src = src.replace(ayuRe, block + '\n\n')
    } else {
      throw new Error('neither palette markers nor the Ayu block were found in src/worker.ts')
    }
    fs.writeFileSync(workerPath, src)
    console.log('\nWrote palette block into src/worker.ts')
  } else {
    fs.writeFileSync(path.join(ROOT, '.orca-palette-preview.txt'), block)
    console.log('\nPreview written to .orca-palette-preview.txt')
  }
}

main()
