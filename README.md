# fuzzy-files

Quickly find and take an action over project files.

![fuzzy-files](https://github.com/asiloisad/pulsar-fuzzy-files/raw/master/assets/fuzzy-files.png)

Fork of [fuzzy-finder](https://github.com/pulsar-edit/pulsar/tree/master/packages/fuzzy-finder).

## Features

- **Fast fuzzy search**: Uses algorithm with smart scoring. Results are ranked by match quality, adjusted by relative distance from the active editor file and directory depth. Files closer to your current context appear higher.
- **Line navigation**: Jump to specific line using `:` syntax (e.g., `file.js:42`).
- **Multiple projects**: Supports multiple project paths.
- **Real-time updates**: Auto-refreshes on file create/delete/rename.
- **File icons**: Display file icons in the list, via [file-icons](https://github.com/file-icons/atom).
- **External opening**: Open files with external applications, via [open-external](https://github.com/asiloisad/pulsar-open-external).
- **Chat attachment**: Attach file to Claude chat context, via [claude-chat](https://github.com/asiloisad/pulsar-claude-chat).
- **Clipboard support**: Copy/cut file to Windows clipboard (Windows only), via [windows-clip](https://github.com/asiloisad/pulsar-windows-clip).
- **Tree view reveal**: Reveal selected file in tree view, via [tree-view-plus](https://github.com/asiloisad/pulsar-tree-view-plus).

## Installation

To install `fuzzy-files` search for [fuzzy-files](https://web.pulsar-edit.dev/packages/fuzzy-files) in the Install pane of the Pulsar settings or run `ppm install fuzzy-files`. Alternatively, you can run `ppm install asiloisad/pulsar-fuzzy-files` to install a package directly from the GitHub repository.

**Note**: This package automatically disables the built-in `fuzzy-finder` package to avoid conflicts.

## Commands

Commands available in `atom-workspace`:

- `fuzzy-files:toggle`: toggle fuzzy files panel,
- `fuzzy-files:update`: refresh file cache.

Commands available in `.fuzzy-files`:

- `select-list:open`: open file,
- `select-list:open-external`: open file externally,
- `select-list:show-in-folder`: show in folder,
- `select-list:trash`: move file to trash,
- `select-list:split-left/right/up/down`: open in split pane,
- `select-list:update`: refresh file index,
- `select-list:copy-r`: copy relative path,
- `select-list:copy-p`: copy project path,
- `select-list:copy-a`: copy absolute path,
- `select-list:copy-n`: copy file name,
- `select-list:insert-r`: insert relative path,
- `select-list:insert-p`: insert project path,
- `select-list:insert-a`: insert absolute path,
- `select-list:insert-n`: insert file name,
- `select-list:default-slash`: use default separator,
- `select-list:forward-slash`: use forward slash,
- `select-list:backslash`: use backslash,
- `select-list:query-item`: set query from selected item path,
- `select-list:query-selection`: set query from editor selection,
- `select-list:reveal-in-tree-view`: reveal selected file in tree view (requires [tree-view-plus](https://github.com/asiloisad/pulsar-tree-view-plus)),
- `select-list:cut-file`: cut selected file,
- `select-list:copy-file`: copy selected file.

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

Opens files with external applications. Provided by [open-external](https://github.com/asiloisad/pulsar-open-external).

## Consumed Service `claude-chat`

Attaches selected files to the Claude chat context. Provided by [claude-chat](https://github.com/asiloisad/pulsar-claude-chat).

## Consumed Service `windows-clip`

Copy and cut files to the Windows clipboard. Provided by [windows-clip](https://github.com/asiloisad/pulsar-windows-clip).

## Consumed Service `tree-view-plus`

Reveals the selected file in the tree view. Provided by [tree-view-plus](https://github.com/asiloisad/pulsar-tree-view-plus).

## Contributing

Got ideas to make this package better, found a bug, or want to help add new features? Just drop your thoughts on GitHub. Any feedback is welcome!
