import { describe, it, expect } from 'vitest'
import activate from './worker'

function makeOrca() {
  const storage = new Map()
  const applied = []
  const status = []
  const commands = new Map()
  const orca = {
    storage: {
      get: async (k) => (storage.has(k) ? storage.get(k) : null),
      set: async (k, v) => storage.set(k, v),
    },
    host: {
      call: async (method, params) => {
        if (method === 'appearance.read') return { revision: 'rev-1' }
        if (method === 'appearance.apply') { applied.push(params); return {} }
        if (method === 'statusBar.update') { status.push(params); return { ok: true } }
        throw new Error('unexpected host call ' + method)
      },
    },
    commands: { register: (id, fn) => commands.set(id, fn) },
    panels: { handle: () => {}, post: () => {} },
  }
  return { orca, storage, applied, status, commands }
}

describe('worker toggle', () => {
  it('applies dark then light and updates the status glyph', async () => {
    const { orca, applied, status, commands } = makeOrca()
    activate(orca)
    await new Promise((r) => setTimeout(r, 0))
    expect(status.at(-1).text).toBe('☀')

    const first = await commands.get('toggle')()
    expect(first).toBe('dark')
    expect(JSON.parse(applied.at(-1).app).base).toBe('dark')
    expect(status.at(-1).text).toBe('☾')

    const second = await commands.get('toggle')()
    expect(second).toBe('light')
    expect(JSON.parse(applied.at(-1).app).base).toBe('light')
    expect(status.at(-1).text).toBe('☀')
  })

  it('falls back to the neutral palette when a configured theme is missing', async () => {
    const { orca, storage, applied, commands } = makeOrca()
    storage.set('darkTheme', 'plugin:test/themes/dark')
    activate(orca)
    await new Promise((r) => setTimeout(r, 0))
    await commands.get('toggle')()
    expect(applied.length).toBe(1)
    expect(JSON.parse(applied.at(-1).app).base).toBe('dark')
  })
})
