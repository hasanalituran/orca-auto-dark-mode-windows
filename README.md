# Toggle Light/Dark Theme - Orca Plugin

An [Orca](https://github.com/stablyai/orca) plugin that adds a status bar toggle and a
`Toggle Light/Dark Theme` command to switch Orca between light and dark themes, using any
installed Orca themes you choose. Defaults to Orca's neutral palette when nothing is configured.

## Features

- **Status bar toggle** showing ☀ for light and ☾ for dark.
- **Theme Picker panel** (right sidebar) with dropdowns listing every installed theme plus
  **Orca built-in** for light and dark. Selecting a theme applies it immediately.
- **Scheduled auto mode**: switch to the dark theme at one time and the light theme at another,
  to the minute (24-hour `HH:MM`, e.g. `07:00` / `19:30`). A manual toggle opts out of auto
  until you re-enable it.
- **Use Orca defaults** resets to Orca's real built-in light/dark palette (not a third-party
  theme), and turns auto mode off.
- **List Installed Themes** command prints theme content ids to the plugin log.

## Orca built-in palette

"Orca built-in" applies Orca's actual default light/dark colors, extracted from Orca itself:
app chrome tokens from Orca's compiled CSS, editor syntax from its bundled Light+/Dark+ Monaco
themes, and the terminal palettes from Orca's `Ghostty Default Style Dark` / `Builtin Tango Light`.
The palette is bundled as constants in `src/worker.ts`. To resync after Orca changes its theme:

```sh
node scripts/sync-orca-palette.mjs --write
```

The script reads the locally installed Orca app (`ORCA_RESOURCES` overrides the default macOS path).

## Install

```sh
orca plugin install hasanalituran/orca-auto-dark-mode-windows
```

Or search **Toggle Light/Dark Theme** in Orca's plugin browser:
[orca.dev/plugins/hasanalituran/orca-auto-dark-mode-windows](https://www.onorca.dev/plugins/hasanalituran/orca-auto-dark-mode-windows).

## Configure

1. Open the **Theme Picker** panel.
2. Pick a theme for **Light theme** and **Dark theme** from the dropdowns.
3. Use the status bar **☀/☾** button to switch between them.

## Develop

```sh
orca plugin validate .
orca plugin check .
orca plugin dev watch .
```

## Test

```sh
npm install
npm test
```

CI runs the same tests on every push and pull request.

## License

MIT
