import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import * as fs from 'node:fs'
import * as path from 'node:path'
import * as os from 'node:os'
import {
  parseContentId,
  findPluginDir,
  resolveTheme,
  listInstalledThemes,
  orcaUserDataDir,
} from './resolver'

let tmp

beforeEach(() => {
  tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'orca-test-'))
})

afterEach(() => {
  fs.rmSync(tmp, { recursive: true, force: true })
})

describe('parseContentId', () => {
  it('parses valid id', () => {
    expect(parseContentId('plugin:stablyai.orca-ayu-theme/ayu-dark')).toEqual({
      pluginKey: 'stablyai.orca-ayu-theme',
      themeId: 'ayu-dark',
    })
  })
  it('returns null for invalid', () => {
    expect(parseContentId('foo')).toBeNull()
    expect(parseContentId('')).toBeNull()
  })
})

describe('findPluginDir', () => {
  it('finds plugin dir with manifest', () => {
    const pluginDir = path.join(tmp, 'plugins', 'p', 'hash1')
    fs.mkdirSync(pluginDir, { recursive: true })
    fs.writeFileSync(path.join(pluginDir, 'orca-plugin.json'), '{}')
    expect(findPluginDir(tmp, 'p')).toBe(pluginDir)
  })
  it('returns null if missing', () => {
    expect(findPluginDir(tmp, 'nope')).toBeNull()
  })
})

describe('resolveTheme', () => {
  it('resolves theme files', () => {
    const pluginDir = path.join(tmp, 'plugins', 'p', 'hash1')
    fs.mkdirSync(path.join(pluginDir, 'themes'), { recursive: true })
    fs.mkdirSync(path.join(pluginDir, 'terminal'), { recursive: true })
    fs.writeFileSync(path.join(pluginDir, 'orca-plugin.json'), JSON.stringify({
      contributes: {
        themes: [{ id: 't', path: 'themes/t.json' }],
        terminalThemes: [{ id: 't', path: 'terminal/t.json' }],
      },
    }))
    fs.writeFileSync(path.join(pluginDir, 'themes', 't.json'), '{"base":"dark"}')
    fs.writeFileSync(path.join(pluginDir, 'terminal', 't.json'), '{"mode":"dark"}')
    const r = resolveTheme(tmp, 'plugin:p/t')
    expect(r).toEqual({ app: '{"base":"dark"}', terminal: '{"mode":"dark"}' })
  })
  it('returns null for missing theme', () => {
    expect(resolveTheme(tmp, 'plugin:p/nope')).toBeNull()
  })
})

describe('listInstalledThemes', () => {
  it('lists themes', () => {
    const pluginDir = path.join(tmp, 'plugins', 'p', 'hash1')
    fs.mkdirSync(pluginDir, { recursive: true })
    fs.writeFileSync(path.join(pluginDir, 'orca-plugin.json'), JSON.stringify({
      contributes: { themes: [{ id: 'a' }, { id: 'b' }] },
    }))
    expect(listInstalledThemes(tmp)).toEqual(['plugin:p/a', 'plugin:p/b'])
  })
})
