export {}

declare module 'orca' {
  interface PluginRequests {
    'themes.list': { output: { themes: string[] } }
    'config.get': { output: { light: string; dark: string } }
    'config.set': { input: { light?: string; dark?: string }; output: { light: string; dark: string } }
    'toggle': { output: { mode: 'dark' | 'light' } }
    'themeMode.get': { output: { mode: 'manual' | 'auto' } }
    'themeMode.set': { input: { mode: 'manual' | 'auto' }; output: { mode: 'manual' | 'auto' } }
    'autoTimes.get': { output: { light: string; dark: string } }
    'autoTimes.set': { input: { light?: string; dark?: string }; output: { light: string; dark: string } }
  }
  interface PluginPanelEvents {
    'config.changed': { light: string; dark: string }
    'themeMode.changed': { mode: 'manual' | 'auto'; light: string; dark: string }
  }
}
