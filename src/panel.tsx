import {
  atom,
  Button,
  Heading,
  plugin,
  read,
  Row,
  Select,
  set,
  Stack,
  Text,
  type PanelContext,
} from 'orca'

const themes = atom<string[]>([])
const lightTheme = atom<string>('')
const darkTheme = atom<string>('')
const status = atom<string>('')

export function setup(ctx: PanelContext): void {
  ctx.subscriptions.push(
    plugin.on('config.changed', (payload: any) => {
      set(lightTheme, payload.light)
      set(darkTheme, payload.dark)
    })
  )
  void plugin.request('themes.list').then((r: any) => set(themes, r.themes))
  void plugin.request('config.get').then((r: any) => {
    set(lightTheme, r.light)
    set(darkTheme, r.dark)
  })
}

async function saveLight(value: string) {
  set(lightTheme, value)
  await plugin.request('config.set', { light: value })
  await plugin.request('apply', { mode: 'light' })
  set(status, 'Applied ' + value)
}

async function saveDark(value: string) {
  set(darkTheme, value)
  await plugin.request('config.set', { dark: value })
  await plugin.request('apply', { mode: 'dark' })
  set(status, 'Applied ' + value)
}

export default function Panel() {
  const list = read(themes)
  const light = read(lightTheme)
  const dark = read(darkTheme)
  const statusText = read(status)
  const options = list.map((t) => ({ value: t, label: t }))
  return (
    <Stack gap="md">
      <Heading>Toggle Theme</Heading>
      <Text muted size="xs">Pick the themes to switch between.</Text>
      <Select
        label="Light theme"
        value={light}
        options={options}
        onChange={(v: string) => void saveLight(v)}
      />
      <Select
        label="Dark theme"
        value={dark}
        options={options}
        onChange={(v: string) => void saveDark(v)}
      />
      {statusText ? <Text size="xs">{statusText}</Text> : null}
    </Stack>
  )
}