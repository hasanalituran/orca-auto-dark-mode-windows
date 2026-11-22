# Toggle Light/Dark Theme - Orca Plugin

An [Orca](https://github.com/stablyai/orca) plugin that adds a status bar toggle and a
`Toggle Light/Dark Theme` command to switch Orca between light and dark themes, using any
installed Orca themes you choose. Defaults to Orca's neutral palette when nothing is configured.

## Features

- **Status bar toggle** showing ☀ for light and ☾ for dark.
- **Theme Picker panel** (right sidebar) with dropdowns listing every installed theme for light
  and dark mode. Selecting a theme applies it immediately.
- **Use Orca defaults** button resets to the neutral palette.
- **List Installed Themes** command prints theme content ids to the plugin log.
- Falls back to the neutral palette if a configured theme cannot be resolved.

## Install

```sh
orca plugin install "https://github.com/hasanalituran/orca-auto-dark-mode-windows#v0.1.7"
```

Or search **Toggle Light/Dark Theme** in Orca's plugin browser once the listing is picked up.

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
