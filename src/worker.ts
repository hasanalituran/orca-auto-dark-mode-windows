import type { OrcaWorkerApi } from 'orca/worker'

const STORAGE_KEY = 'mode'

const DARK_APP = JSON.stringify({
  schemaVersion: 1,
  base: 'dark',
  tokens: { '--background': '#1e1e1e', '--foreground': '#d4d4d4' }
})
const LIGHT_APP = JSON.stringify({
  schemaVersion: 1,
  base: 'light',
  tokens: { '--background': '#ffffff', '--foreground': '#000000' }
})
const DARK_TERMINAL = JSON.stringify({
  schemaVersion: 1,
  mode: 'dark',
  terminal: { background: '#1e1e1e', foreground: '#d4d4d4', black: '#000000' }
})
const LIGHT_TERMINAL = JSON.stringify({
  schemaVersion: 1,
  mode: 'light',
  terminal: { background: '#ffffff', foreground: '#000000', black: '#000000' }
})

export default function activate(orca: OrcaWorkerApi): void {
  async function currentMode(): Promise<'dark' | 'light'> {
    const value = await orca.storage.get(STORAGE_KEY)
    return value === 'dark' ? 'dark' : 'light'
  }

  async function applyMode(mode: 'dark' | 'light'): Promise<void> {
    const revisionResult = (await orca.host.call('appearance.read')) as { revision: string }
    const app = mode === 'dark' ? DARK_APP : LIGHT_APP
    const terminal = mode === 'dark' ? DARK_TERMINAL : LIGHT_TERMINAL
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

  orca.commands.register('toggle', async () => toggle())

  // Exposed for `orca plugin dev request`.
  orca.panels.handle('toggle', async () => ({ mode: await toggle() }))

  // Reflect the stored mode in the status bar on startup.
  void currentMode().then((mode) => {
    void orca.host.call('statusBar.update', {
      id: 'toggle',
      text: mode === 'dark' ? 'Dark' : 'Light',
      icon: 'lightbulb'
    })
  })
}