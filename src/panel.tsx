import {
  atom,
  Button,
  Heading,
  Input,
  plugin,
  read,
  Row,
  Select,
  set,
  Stack,
  Switch,
  Text,
  type PanelContext,
} from 'orca'

const BUILTIN = 'builtin'
const TIME_RE = /^([01]?\d|2[0-3]):[0-5]\d$/

const themes = atom<string[]>([])
const lightTheme = atom<string>('')
const darkTheme = atom<string>('')
const themeMode = atom<'manual' | 'auto'>('manual')
const autoLight = atom<string>('07:00')
const autoDark = atom<string>('19:00')
const status = atom<string>('')

export function setup(ctx: PanelContext): void {
  ctx.subscriptions.push(
    plugin.on('config.changed', (payload: any) => {
      set(lightTheme, payload.light)
      set(darkTheme, payload.dark)
    }),
    plugin.on('themeMode.changed', (payload: any) => {
      set(themeMode, payload.mode)
      set(autoLight, payload.light)
      set(autoDark, payload.dark)
    })
  )
  void plugin.request('themes.list').then((r: any) => set(themes, r.themes))
  void plugin.request('config.get').then((r: any) => {
    set(lightTheme, r.light)
    set(darkTheme, r.dark)
  })
  void plugin.request('themeMode.get').then((r: any) => set(themeMode, r.mode))
  void plugin.request('autoTimes.get').then((r: any) => {
    set(autoLight, r.light)
    set(autoDark, r.dark)
  })
}

async function saveLight(value: string) {
  set(lightTheme, value)
  await plugin.request('config.set', { light: value })
  await plugin.request('apply', { mode: 'light' })
  set(status, 'Applied ' + (value === BUILTIN ? 'Orca built-in' : value))
}

async function saveDark(value: string) {
  set(darkTheme, value)
  await plugin.request('config.set', { dark: value })
  await plugin.request('apply', { mode: 'dark' })
  set(status, 'Applied ' + (value === BUILTIN ? 'Orca built-in' : value))
}

async function resetDefaults() {
  set(lightTheme, BUILTIN)
  set(darkTheme, BUILTIN)
  set(themeMode, 'manual')
  set(autoLight, '07:00')
  set(autoDark, '19:00')
  await plugin.request('config.set', { light: BUILTIN, dark: BUILTIN })
  await plugin.request('themeMode.set', { mode: 'manual' })
  await plugin.request('autoTimes.set', { light: '07:00', dark: '19:00' })
  set(status, 'Reset to Orca built-in themes')
}

async function setAutoMode(checked: boolean) {
  await plugin.request('themeMode.set', { mode: checked ? 'auto' : 'manual' })
  set(themeMode, checked ? 'auto' : 'manual')
  set(status, checked ? 'Auto mode on' : 'Auto mode off')
}

async function setAutoTime(side: 'light' | 'dark', value: string) {
  // Keep the field editable: accept any typing (so the user can clear and
  // retype), but only persist a complete HH:MM.
  set(side === 'light' ? autoLight : autoDark, value)
  if (!TIME_RE.test(value)) {
    set(status, 'Enter a 24-hour time like 07:30')
    return
  }
  await plugin.request('autoTimes.set', { [side]: value })
  set(status, 'Auto time updated')
}

export default function Panel() {
  const list = read(themes)
  const light = read(lightTheme)
  const dark = read(darkTheme)
  const mode = read(themeMode)
  const lightTime = read(autoLight)
  const darkTime = read(autoDark)
  const statusText = read(status)
  const options = [
    { value: BUILTIN, label: 'Orca built-in' },
    ...list.map((t) => ({ value: t, label: t })),
  ]
  const isAuto = mode === 'auto'
  return (
    <Stack gap="md">
      <Heading>Toggle Theme</Heading>
      <Text muted size="xs">Pick the themes to switch between.</Text>
      <Switch
        label="Auto mode (scheduled)"
        checked={isAuto}
        onChange={(checked) => void setAutoMode(checked)}
      />
      {isAuto ? (
        <Stack gap="xs">
          <Text muted size="xs">Switch at these local times (24-hour HH:MM)</Text>
          <Row gap="xs">
            <Input
              label="Light theme at"
              type="text"
              value={lightTime}
              onChange={(v) => void setAutoTime('light', v)}
            />
            <Input
              label="Dark theme at"
              type="text"
              value={darkTime}
              onChange={(v) => void setAutoTime('dark', v)}
            />
          </Row>
        </Stack>
      ) : null}
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
      <Row gap="xs">
        <Button variant="ghost" onPress={() => void resetDefaults()}>Use Orca defaults</Button>
      </Row>
      {statusText ? <Text size="xs">{statusText}</Text> : null}
    </Stack>
  )
}
