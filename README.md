# fuzzy-files

Quickly find and open project files with fuzzy search. Designed as a replacement for `fuzzy-finder` with enhanced features, multiple actions, and package integrations.

![fuzzy-files](https://github.com/asiloisad/pulsar-fuzzy-files/raw/master/assets/fuzzy-files.png)

## Features

- **Fast fuzzy search**: Uses the `command-t` algorithm with smart scoring.
- **Line navigation**: Jump to specific line using `:` syntax (e.g., `file.js:42`).
- **File icons**: Displays icons via [file-icons](https://github.com/file-icons/atom).
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
- `select-list:open-externally`: (`Alt+Enter`) open file externally,
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

## Contributing

Got ideas to make this package better, found a bug, or want to help add new features? Just drop your thoughts on GitHub — any feedback's welcome!
