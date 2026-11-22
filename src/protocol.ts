export {}

declare module 'orca' {
  interface PluginRequests {
    'themes.list': { output: { themes: string[] } }
    'config.get': { output: { light: string; dark: string } }
    'config.set': { input: { light?: string; dark?: string }; output: { light: string; dark: string } }
    'toggle': { output: { mode: 'dark' | 'light' } }
  }
  interface PluginPanelEvents {
    'config.changed': { light: string; dark: string }
  }
}