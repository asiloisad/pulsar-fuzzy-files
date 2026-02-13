# fuzzy-files

Quickly find and take an action over project files. Designed as a replacement for `fuzzy-finder` with fuzzy search, multiple actions, and package integrations.

![fuzzy-files](https://github.com/asiloisad/pulsar-fuzzy-files/raw/master/assets/fuzzy-files.png)

## Features

- **Fast fuzzy search**: Uses algorithm with smart scoring. Results are ranked by match quality, adjusted by relative distance from the active editor file and directory depth — files closer to your current context appear higher.
- **Line navigation**: Jump to specific line using `:` syntax (e.g., `file.js:42`).
- **Multiple projects**: Supports multiple project paths.
- **Real-time updates**: Auto-refreshes on file create/delete/rename.
- **[file-icons](https://github.com/file-icons/atom)**: Display file icons in the list.
- **[open-external](https://web.pulsar-edit.dev/packages/open-external)**: (`Alt+Enter`) Open files with external applications.
- **[claude-chat](https://web.pulsar-edit.dev/packages/claude-chat)**: (`Alt+F`) Attach file to Claude chat context.
- **[windows-clip](https://web.pulsar-edit.dev/packages/windows-clip)**: (`Alt+W Alt+C/X`) Copy/cut file to Windows clipboard (Windows only).

## Installation

To install `fuzzy-files` search for [fuzzy-files](https://web.pulsar-edit.dev/packages/fuzzy-files) in the Install pane of the Pulsar settings or run `ppm install fuzzy-files`. Alternatively, you can run `ppm install asiloisad/pulsar-fuzzy-files` to install a package directly from the GitHub repository.

## Commands

Commands available in `atom-workspace`:

- `fuzzy-files:toggle`: (`Ctrl+P`) toggle fuzzy files panel,
- `fuzzy-files:update`: refresh file cache.

Commands available in `.fuzzy-files`:

- `select-list:open`: (`Enter`) open file,
- `select-list:open-external`: (`Alt+Enter`) open file externally,
- `select-list:show-in-folder`: (`Ctrl+Enter`) show in folder,
- `select-list:trash`: (`Alt+Delete`) move file to trash,
- `select-list:split-left/right/up/down`: (`Alt+Left/Right/Up/Down`) open in split pane,
- `select-list:update`: (`F5`) refresh file index,
- `select-list:copy-r`: (`Alt+C`) copy relative path,
- `select-list:copy-p`: (`Alt+C Alt+P`) copy project path,
- `select-list:copy-a`: (`Alt+C Alt+A`) copy absolute path,
- `select-list:copy-n`: (`Alt+C Alt+N`) copy file name,
- `select-list:insert-r`: (`Alt+V`) insert relative path,
- `select-list:insert-p`: (`Alt+V Alt+P`) insert project path,
- `select-list:insert-a`: (`Alt+V Alt+A`) insert absolute path,
- `select-list:insert-n`: (`Alt+V Alt+N`) insert file name,
- `select-list:default-slash`: (`Alt+0`) use default separator,
- `select-list:forward-slash`: (`Alt+/`) use forward slash,
- `select-list:backslash`: (`Alt+\`) use backslash,
- `select-list:query-item`: (`Alt+Q`) set query from selected item path,
- `select-list:query-selection`: (`Alt+S`) set query from editor selection.

## Services

### Provided

#### `fuzzy-files.score-modifier`

Allows other packages to register functions that modify the score of search results. Consumer packages can use this to boost or penalize specific files in the ranking.

```javascript
// in package.json:
// "consumedServices": {
//   "fuzzy-files.score-modifier": { "versions": { "^1.0.0": "consumeScoreModifier" } }
// }

consumeScoreModifier(service) {
  return service.add((score, item) => {
    // item: { fPath, aPath, pPath, nPath, rPath, distance }
    return score * multiplier;
  });
}
```

### Consumed

- **[file-icons](https://github.com/file-icons/atom)** `atom.file-icons` — file type icons
- **[open-external](https://web.pulsar-edit.dev/packages/open-external)** `open-external` — open files externally
- **[claude-chat](https://web.pulsar-edit.dev/packages/claude-chat)** `claude-chat` — attach files to Claude chat
- **[windows-clip](https://web.pulsar-edit.dev/packages/windows-clip)** `windows-clip` — clipboard operations (Windows)

## Contributing

Got ideas to make this package better, found a bug, or want to help add new features? Just drop your thoughts on GitHub — any feedback's welcome!
