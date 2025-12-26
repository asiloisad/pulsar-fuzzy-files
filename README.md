# fuzzy-files

Quickly find and take an action over project files. Designed as a replacement for the built-in `fuzzy-finder` with enhanced features. Supports multiple actions, path operations, and integrations with other packages.

![fuzzy-files](https://github.com/asiloisad/pulsar-fuzzy-files/raw/master/assets/fuzzy-files.png)

## Installation

To install `fuzzy-files` search for [fuzzy-files](https://web.pulsar-edit.dev/packages/fuzzy-files) in the Install pane of the Pulsar settings or run `ppm install fuzzy-files`. Alternatively, you can run `ppm install asiloisad/pulsar-fuzzy-files` to install a package directly from the GitHub repository.

## Features

- Fast fuzzy file search using the `command-t` algorithm
- Smart scoring based on file proximity and directory depth
- Navigate to specific line number using `:` syntax (e.g., `file.js:42`)
- File icons support via [file-icons](https://github.com/file-icons/atom)
- Multiple project paths support
- Real-time file watching (auto-updates on file create/delete/rename)

## Commands

| Keybinding | Action |
|------------|--------|
| `Ctrl+P` | Toggle fuzzy files panel |
| `Enter` | Open file |
| `Alt+Enter` | Open file externally |
| `Ctrl+Enter` | Show in folder |
| `Alt+Delete` or `Alt+D` | Move file to trash |
| `Alt+Left/Right/Up/Down` | Open in split pane |
| `F5` | Refresh file index |

### Path Operations

Copy or insert file paths with configurable separators:

| Keybinding | Action |
|------------|--------|
| `Alt+C` | Copy relative path |
| `Alt+C Alt+P` | Copy project path |
| `Alt+C Alt+A` | Copy absolute path |
| `Alt+C Alt+R` | Copy relative path |
| `Alt+C Alt+N` | Copy file name |
| `Alt+V` | Insert relative path |
| `Alt+V Alt+P` | Insert project path |
| `Alt+V Alt+A` | Insert absolute path |
| `Alt+V Alt+R` | Insert relative path |
| `Alt+V Alt+N` | Insert file name |

### Separator Settings

| Keybinding | Action |
|------------|--------|
| `Alt+0` | Use default separator |
| `Alt+/` | Use forward slash |
| `Alt+\` | Use backslash |

### Query Helpers

| Keybinding | Action |
|------------|--------|
| `Alt+Q` | Set query from selected item path |
| `Alt+S` | Set query from editor selection |

## Configuration

| Setting | Description | Default |
|---------|-------------|---------|
| `ignoredNames` | Glob patterns for files/directories to ignore (merged with `core.ignoredNames`) | `[]` |
| `insertSep` | Path separator type: Default, Forward Slash, or Backslash | `Default` |

## Integrations

| Package | Keybinding | Description |
|---------|------------|-------------|
| [file-icons](https://github.com/file-icons/atom) | — | Display file icons in the list |
| [open-external](https://web.pulsar-edit.dev/packages/open-external) | `Alt+Enter` | Open files with external applications |
| [claude-chat](https://web.pulsar-edit.dev/packages/claude-chat) | `Alt+F` | Attach file to Claude chat context |
| [windows-clipboard](https://web.pulsar-edit.dev/packages/windows-clipboard) | `Alt+W Alt+C/X` | Copy/cut file to Windows clipboard (Windows only) |

## Contributing

Got ideas to make this package better, found a bug, or want to help add new features? Just drop your thoughts on GitHub — any feedback's welcome!
