import { describe, it, expect } from 'vitest'
import * as fs from 'node:fs'

const manifest = JSON.parse(fs.readFileSync(new URL('../orca-plugin.json', import.meta.url), 'utf8'))

describe('orca-plugin.json', () => {
  it('has a non-reserved id', () => {
    expect(manifest.id).toBeTruthy()
    expect(manifest.id.startsWith('orca-')).toBe(false)
  })
  it('has a semver version', () => {
    expect(manifest.version).toMatch(/^\d+\.\d+\.\d+$/)
  })
  it('declares the theme picker panel and status bar toggle', () => {
    expect(manifest.contributes.panels.some((p) => p.id === 'theme-picker')).toBe(true)
    const item = manifest.contributes.statusBarItems.find((i) => i.id === 'toggle')
    expect(item).toBeTruthy()
    expect(item.command).toBe('toggle')
    expect(item.text.length).toBeGreaterThan(0)
  })
  it('needs appearance:write and storage:own', () => {
    const kinds = manifest.capabilities.map((c) => c.kind)
    expect(kinds).toContain('appearance:write')
    expect(kinds).toContain('storage:own')
  })
})
