# fuzzy-files

Quickly find and take an action over project files.

![fuzzy-files](https://github.com/asiloisad/pulsar-fuzzy-files/raw/master/assets/fuzzy-files.png)

Fork of [fuzzy-finder](https://github.com/pulsar-edit/pulsar/tree/master/packages/fuzzy-finder).

## Features

- **Fast fuzzy search**: Uses algorithm with smart scoring. Results are ranked by match quality, adjusted by relative distance from the active editor file and directory depth. Files closer to your current context appear higher.
- **Line navigation**: Jump to specific line using `:` syntax (e.g., `file.js:42`).
- **Multiple projects**: Supports multiple project paths.
- **Real-time updates**: Auto-refreshes on file create/delete/rename.
- **[file-icons](https://github.com/file-icons/atom)**: Display file icons in the list.
- **[open-external](https://web.pulsar-edit.dev/packages/open-external)**: (<kbd>Alt+Enter</kbd>) Open files with external applications.
- **[claude-chat](https://web.pulsar-edit.dev/packages/claude-chat)**: (<kbd>Alt+F</kbd>) Attach file to Claude chat context.
- **[windows-clip](https://web.pulsar-edit.dev/packages/windows-clip)**: (<kbd>Alt+W Alt+C/X</kbd>) Copy/cut file to Windows clipboard (Windows only).

## Installation

To install `fuzzy-files` search for [fuzzy-files](https://web.pulsar-edit.dev/packages/fuzzy-files) in the Install pane of the Pulsar settings or run `ppm install fuzzy-files`. Alternatively, you can run `ppm install asiloisad/pulsar-fuzzy-files` to install a package directly from the GitHub repository.

**Note**: This package automatically disables the built-in `fuzzy-finder` package to avoid conflicts.

## Commands

Commands available in `atom-workspace`:

- `fuzzy-files:toggle`: <kbd>Ctrl+P</kbd> toggle fuzzy files panel,
- `fuzzy-files:update`: refresh file cache.

Commands available in `.fuzzy-files`:

- `select-list:open`: <kbd>Enter</kbd> open file,
- `select-list:open-external`: <kbd>Alt+Enter</kbd> open file externally,
- `select-list:show-in-folder`: <kbd>Ctrl+Enter</kbd> show in folder,
- `select-list:trash`: <kbd>Alt+Delete</kbd> move file to trash,
- `select-list:split-left/right/up/down`: <kbd>Alt+Left/Right/Up/Down</kbd> open in split pane,
- `select-list:update`: <kbd>F5</kbd> refresh file index,
- `select-list:copy-r`: <kbd>Alt+C</kbd> copy relative path,
- `select-list:copy-p`: <kbd>Alt+C Alt+P</kbd> copy project path,
- `select-list:copy-a`: <kbd>Alt+C Alt+A</kbd> copy absolute path,
- `select-list:copy-n`: <kbd>Alt+C Alt+N</kbd> copy file name,
- `select-list:insert-r`: <kbd>Alt+V</kbd> insert relative path,
- `select-list:insert-p`: <kbd>Alt+V Alt+P</kbd> insert project path,
- `select-list:insert-a`: <kbd>Alt+V Alt+A</kbd> insert absolute path,
- `select-list:insert-n`: <kbd>Alt+V Alt+N</kbd> insert file name,
- `select-list:default-slash`: <kbd>Alt+0</kbd> use default separator,
- `select-list:forward-slash`: <kbd>Alt+/</kbd> use forward slash,
- `select-list:backslash`: <kbd>Alt+\</kbd> use backslash,
- `select-list:query-item`: <kbd>Alt+Q</kbd> set query from selected item path,
- `select-list:query-selection`: <kbd>Alt+S</kbd> set query from editor selection.

## Provided Service `fuzzy-files.score-modifier`

Allows other packages to register functions that modify the score of search results. Consumer packages can use this to boost or penalize specific files in the ranking.

In your `package.json`:

```json
{
  "consumedServices": {
    "fuzzy-files.score-modifier": {
      "versions": { "^1.0.0": "consumeScoreModifier" }
    }
  }
}
```

In your main module:

```javascript
consumeScoreModifier(service) {
  return service.add((score, item) => {
    // item: { fPath, aPath, pPath, nPath, rPath, distance }
    return score * multiplier;
  });
}
```

## Consumed Service `atom.file-icons`

Displays file type icons next to entries in the file list. Provided by [file-icons](https://github.com/file-icons/atom).

## Consumed Service `open-external`

Opens files with external applications via <kbd>Alt+Enter</kbd>. Provided by [open-external](https://web.pulsar-edit.dev/packages/open-external).

## Consumed Service `claude-chat`

Attaches selected files to the Claude chat context via <kbd>Alt+F</kbd>. Provided by [claude-chat](https://web.pulsar-edit.dev/packages/claude-chat).

## Consumed Service `windows-clip`

Copy and cut files to the Windows clipboard via <kbd>Alt+W</kbd>. Provided by [windows-clip](https://web.pulsar-edit.dev/packages/windows-clip).

## Contributing

Got ideas to make this package better, found a bug, or want to help add new features? Just drop your thoughts on GitHub. Any feedback is welcome!
