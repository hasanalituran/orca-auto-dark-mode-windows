# Toggle Light/Dark Theme - Orca Plugin

An [Orca](https://github.com/stablyai/orca) plugin that adds a status bar button (and a
`Toggle Light/Dark Theme` command) to switch Orca between light and dark app themes, using
your preferred installed themes (defaults to Ayu when available, neutral otherwise).

## Features

- **Status bar item** + command to toggle between your configured light and dark themes.
- **Theme Picker panel** (right sidebar) with dropdowns to choose any installed theme for
  light and dark modes. Selecting a theme applies it immediately.
- **List Installed Themes** command prints available theme content ids to the plugin log.
- Falls back to a neutral palette if a configured theme can't be resolved.

## Install

```sh
orca plugin install "https://github.com/hasanalituran/orca-auto-dark-mode-windows#v0.1.3"
```

Or from the Orca plugin browser once listed.

## Configure

Open the **Theme Picker** panel and pick a theme for light and dark mode from the
dropdowns (populated from your installed themes). The status bar **Theme** button toggles
between them.

## Develop

```sh
orca plugin validate .
orca plugin check .
orca plugin dev watch .
```

## License

MIT