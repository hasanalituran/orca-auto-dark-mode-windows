# Toggle Light/Dark Theme - Orca Plugin

An [Orca](https://github.com/stablyai/orca) plugin that adds a status bar button (and a
`Toggle Light/Dark Theme` command) to switch Orca between its light and dark app themes, like
the VS Code extension
[Toggle Light/Dark Theme](https://github.com/danielgjackson/vscode-auto-dark-mode-windows).

## What it does

- Adds a **Theme** item to Orca's status bar.
- Registers the **Toggle Light/Dark Theme** command (runnable from the command palette or bound
  to a keybinding).
- Clicking either publishes a minimal light or dark appearance artifact via Orca's
  `appearance.apply` host API, flipping Orca's color mode.

## Install (development)

```sh
orca plugin system on
orca plugin dev load /path/to/this/folder --approve <fingerprint>
```

Orca prints the fingerprint on the first `dev load`.

## Develop

```sh
orca plugin validate .
orca plugin check .
orca plugin dev watch .
```

## License

MIT