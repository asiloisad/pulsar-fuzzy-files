# fuzzy-files

<p align="center">
  <a href="https://github.com/bacadra/atom-fuzzy-files/tags">
  <img src="https://img.shields.io/github/v/tag/bacadra/atom-fuzzy-files?style=for-the-badge&label=Latest&color=blue" alt="Latest">
  </a>
  <a href="https://github.com/bacadra/atom-fuzzy-files/issues">
  <img src="https://img.shields.io/github/issues-raw/bacadra/atom-fuzzy-files?style=for-the-badge&color=blue" alt="OpenIssues">
  </a>
  <a href="https://github.com/bacadra/atom-fuzzy-files/blob/master/package.json">
  <img src="https://img.shields.io/github/languages/top/bacadra/atom-fuzzy-files?style=for-the-badge&color=blue" alt="Language">
  </a>
  <a href="https://github.com/bacadra/atom-fuzzy-files/blob/master/LICENSE">
  <img src="https://img.shields.io/github/license/bacadra/atom-fuzzy-files?style=for-the-badge&color=blue" alt="Licence">
  </a>
</p>

![path-list](https://github.com/bacadra/atom-fuzzy-files/raw/master/assets/path-list.png)

The Path list is a window for navigating through files in open projects. It allows you to open a file inside the Atom editor, externally, and insert a file path in various formats.

## Installation

### Atom Text Editor

The official Atom packages store has been [disabled](https://github.blog/2022-06-08-sunsetting-atom/). To obtain the latest version, please run the following shell command:

```shell
apm install bacadra/atom-fuzzy-files
```

This will allow you to directly download the package from the GitHub repository.

### Pulsar Text Editor

The package is compatible with [Pulsar](https://pulsar-edit.dev/) and can be installed using the following command:

```shell
ppm install bacadra/atom-fuzzy-files
```

Alternatively, you can directly install [fuzzy-files](https://web.pulsar-edit.dev/packages/fuzzy-files) from the Pulsar package store.

## List view

In the `atom-workspace` space, the following commands are available:

* `fuzzy-files:paths-toggle`: (default `Ctrl-P`) opens the path list.
* `fuzzy-files:paths-cache`: manually caches a file.

In the `path-list` view, the following keymap is available:

* `Enter`: opens the selected file in Atom or changes the query if it is a directory.
* `Alt-Enter`: opens the selected file externally.
* `Ctrl-Enter`: shows the given file in a file manager.
* `Alt-Delete`: moves a path to the OS-specific trash location.
* `Alt-Left`: opens the selected file by splitting to the left.
* `Alt-Right`: opens the selected file by splitting to the right.
* `Alt-Up`: opens the selected file by splitting upwards.
* `Alt-Down`: opens the selected file by splitting downwards.
* `Alt-V Alt-P`: inserts the project path of the selected file.
* `Alt-V Alt-A`: inserts the absolute path of the selected file.
* `Alt-V Alt-R` or `Alt-V`: inserts the relative path of the selected file to the opened file.
* `Alt-V Alt-N`: inserts the name of the selected file.
* `Alt-C Alt-P`: copies the project path of the selected file.
* `Alt-C Alt-A`: copies the absolute path of the selected file.
* `Alt-C Alt-R` or `Alt-C`: copies the relative path of the selected file to the opened file.
* `Alt-C Alt-N`: copies the name of the selected file.
* `Alt-0`: changes the separator in the insert to the system default (does not hide the view).
* `Alt-\`: changes the separator in the insert to `\` (does not hide the view).
* `Alt-/`: changes the separator in the insert to `/` (does not hide the view).
* `Alt-Q`: changes the query to the project file path of the selected item (does not hide the view).
* `Alt-S`: changes the query to the selection (does not hide the view).

## Autocomplete

![autocomplete](https://github.com/bacadra/atom-fuzzy-files/raw/master/assets/autocomplete.png)

This package provides file path hinting options for the Autocomplete package. The paths are displayed relative to the currently active text editor, and the tooltip shows the full file path in the description. This package relies on the cache, which can be built manually or by using the Path List view. To use this feature, type `///` followed by the text you want to filter.

This functionality can be enabled or disabled in the package settings. To use this feature, the paths must already be cached.

## Configuration

The `Preserve last search` config option is used from the `command-palette` package. The ignores are used from `core.ignoredNames` and `fuzzy-files.ignoredNames`.

The `autocomplete-paths` and `path-list` can display icons for files and directories. The [file-icons](https://github.com/file-icons/atom) package is required for this functionality.

# Contributing [🍺](https://www.buymeacoffee.com/asiloisad)

If you have any ideas on how to improve the package, spot any bugs, or would like to support the development of new features, please feel free to share them via GitHub.
