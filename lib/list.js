/** @babel */

const { CompositeDisposable } = require("atom");
const {
  SelectListView,
  createTwoLineItem,
  highlightMatches,
} = require("pulsar-select-list");
const { shell, clipboard } = require("electron");
const path = require("path");
const fs = require("fs");

module.exports = class PathList {
  constructor(S) {
    this.S = S;
    this.openExternalService = null;
    this.windowsClipService = null;
    this.claudeChatService = null;
    this.qunum = 0;
    this.selectList = new SelectListView({
      className: "fuzzy-files",
      items: [],
      maxResults: 50,
      emptyMessage: "No matches found",
      helpMarkdown:
        "Available commands:\n" +
        "- **Enter** — Open file\n" +
        "- **Ctrl+Enter** — Open externally via [open-external](https://web.pulsar-edit.dev/packages/open-external)\n" +
        "- **Alt+Enter** — Show in folder\n" +
        "- **Alt+Left|Right|Up|Down** — Split pane\n" +
        "- **Alt+C P|A|R|N** — Copy path\n" +
        "- **Alt+V P|A|R|N** — Insert path *(P=project, A=absolute, R=relative, N=name)*\n" +
        "- **Alt+D** — Permament deelte file\n" +
        "- **Alt+Q** — Query from item\n" +
        "- **Alt+S** — Query from selection\n" +
        "- **Alt+0|/|\\\\** — Set path separator\n" +
        "- **Alt+F** — Attach file via [claude-chat](https://web.pulsar-edit.dev/packages/claude-chat)\n" +
        "- **Alt+W Alt+C|X** — Copy/cut file  via [windows-clipboard](https://web.pulsar-edit.dev/packages/windows-clipboard)",
      removeDiacritics: true,
      algorithm: "command-t",
      loadingSpinner: true,
      elementForItem: (item, options) => this.elementForItem(item, options),
      didConfirmSelection: () => this.performAction("open"),
      didCancelSelection: () => this.didCancelSelection(),
      willShow: () => this.update(),
      filterKeyForItem: (item) => item.nPath + " " + item.fPath,
      filterQuery: (query) => this.parseQuery(query),
      filterScoreModifier: (score, item) => {
        // Depth: fewer directories = more important/core files
        const depth = (item.fPath.match(/[\\/]/g) || []).length + 1;
        // Combined: distance (proximity) + depth (shallowness)
        return score / (item.distance * Math.sqrt(depth));
      },
    });
    this.disposables = new CompositeDisposable();
    this.disposables.add(
      atom.commands.add(this.selectList.element, {
        "select-list:query-selection": () => this.updateQueryFromSelection(),
      }),
      atom.config.observe("fuzzy-files.insertSep", (value) => {
        this.insertSep = value;
      }),
      atom.commands.add("atom-workspace", {
        "fuzzy-files:toggle": () => this.toggle(),
      }),
      atom.commands.add(this.selectList.element, {
        "select-list:query-item": () => this.updateQueryFromItem(),
        "select-list:open": () => this.performAction("open"),
        "select-list:open-externally": () =>
          this.performAction("open-externally"),
        "select-list:show-in-folder": () =>
          this.performAction("show-in-folder"),
        "select-list:trash": () => this.performAction("trash"),
        "select-list:split-left": () =>
          this.performAction("split", { side: "left" }),
        "select-list:split-right": () =>
          this.performAction("split", { side: "right" }),
        "select-list:split-up": () =>
          this.performAction("split", { side: "up" }),
        "select-list:split-down": () =>
          this.performAction("split", { side: "down" }),
        "select-list:insert-p": () =>
          this.performAction("path", { op: "insert", rel: "p" }),
        "select-list:insert-a": () =>
          this.performAction("path", { op: "insert", rel: "a" }),
        "select-list:insert-r": () =>
          this.performAction("path", { op: "insert", rel: "r" }),
        "select-list:insert-n": () =>
          this.performAction("path", { op: "insert", rel: "n" }),
        "select-list:copy-p": () =>
          this.performAction("path", { op: "copy", rel: "p" }),
        "select-list:copy-a": () =>
          this.performAction("path", { op: "copy", rel: "a" }),
        "select-list:copy-r": () =>
          this.performAction("path", { op: "copy", rel: "r" }),
        "select-list:copy-n": () =>
          this.performAction("path", { op: "copy", rel: "n" }),
        "select-list:update": () => this.refresh(),
        "select-list:default-slash": () => {
          atom.config.set("fuzzy-files.insertSep", 0);
          atom.notifications.addSuccess(
            "Separator has been changed to default"
          );
        },
        "select-list:forward-slash": () => {
          atom.config.set("fuzzy-files.insertSep", 1);
          atom.notifications.addSuccess(
            "Separator has been changed to forward slash"
          );
        },
        "select-list:backslash": () => {
          atom.config.set("fuzzy-files.insertSep", 2);
          atom.notifications.addSuccess(
            "Separator has been changed to backslash"
          );
        },
        "select-list:cut-file": () =>
          this.performAction("clip", { effect: "cut" }),
        "select-list:copy-file": () =>
          this.performAction("clip", { effect: "copy" }),
        "select-list:claude-chat": () => this.performAction("claude-chat"),
      }),
      atom.project.onDidChangePaths((projectPaths) => {
        this.projectCount = projectPaths.length;
      })
    );
    this.projectCount = atom.project.getPaths().length;
  }

  destroy() {
    this.disposables.dispose();
    this.selectList.destroy();
  }

  setOpenExternalService(service) {
    this.openExternalService = service;
  }

  setWindowsClipService(service) {
    this.windowsClipService = service;
  }

  setclaudeChatService(service) {
    this.claudeChatService = service;
  }

  getHelpMarkdown() {
    return fs.readFileSync(path.join(__dirname, "help.md"), "utf8");
  }

  show() {
    this.selectList.show();
  }

  hide() {
    this.selectList.hide();
  }

  toggle() {
    this.selectList.toggle();
  }

  updateQueryFromSelection() {
    this.selectList.setQueryFromSelection();
  }

  didCancelSelection() {
    this.hide();
  }

  elementForItem(item, { matchIndices }) {
    // filterKey format: "nPath fPath" - display only fPath with adjusted offsets
    const offset = item.nPath.length + 1;
    const matches = matchIndices ? matchIndices.map((i) => i - offset) : [];
    return createTwoLineItem({
      primary: highlightMatches(item.fPath, matches),
      secondary: this.projectCount > 1 ? item.pPath : undefined,
      icon: this.S.iconClassForPath(item.aPath),
    });
  }

  performAction(mode, params) {
    let item = this.selectList.getSelectedItem();
    if (!item) {
      return;
    }
    let editor, aPath, text;
    if (mode === "open") {
      aPath = item.aPath;
      try {
        if (!fs.lstatSync(aPath).isFile()) {
          return this.updateQueryFromItem();
        }
      } catch (error) {
        atom.notifications.addError(error.message || String(error), {
          detail: aPath,
        });
      }
    }
    this.hide();
    if (mode === "open") {
      aPath = item.aPath;
      atom.workspace.open(aPath, { initialLine: this.qunum });
    } else if (mode === "open-externally") {
      // Use open-external service if available, fallback to shell
      if (this.openExternalService) {
        this.openExternalService.openExternal(item.aPath);
      } else {
        shell.openPath(item.aPath);
      }
    } else if (mode === "show-in-folder") {
      // Use open-external service if available, fallback to shell
      if (this.openExternalService) {
        this.openExternalService.showInFolder(item.aPath);
      } else {
        shell.showItemInFolder(item.aPath);
      }
    } else if (mode === "trash") {
      aPath = item.aPath;
      // Prefer atom.trashItem (async), fallback to deprecated shell.moveItemToTrash
      if (atom.trashItem) {
        atom
          .trashItem(aPath)
          .then(() => {
            atom.notifications.addSuccess("Item has been trashed", {
              detail: aPath,
            });
          })
          .catch(() => {
            atom.notifications.addError("Item cannot be trashed", {
              detail: aPath,
            });
          });
      } else if (shell.moveItemToTrash) {
        // Deprecated fallback for older Electron versions
        if (shell.moveItemToTrash(aPath)) {
          atom.notifications.addSuccess("Item has been trashed", {
            detail: aPath,
          });
        } else {
          atom.notifications.addError("Item cannot be trashed", {
            detail: aPath,
          });
        }
      }
    } else if (mode === "split") {
      aPath = item.aPath;
      try {
        if (fs.lstatSync(aPath).isFile()) {
          atom.workspace.open(aPath, {
            initialLine: this.qunum,
            split: params.side,
          });
        } else {
          atom.notifications.addError(`Cannot open path, because it's a dir`, {
            detail: aPath,
          });
        }
      } catch (error) {
        atom.notifications.addError(error.message || String(error), {
          detail: aPath,
        });
      }
    } else if (mode === "path") {
      if (params.rel === "p") {
        text = item.fPath;
      } else if (params.rel === "a") {
        text = item.aPath;
      } else if (params.rel === "r") {
        editor = atom.workspace.getActiveTextEditor();
        if (!editor) {
          atom.notifications.addError(
            "Cannot insert path, because there is no active text editor"
          );
          return;
        }
        let editorPath = editor.getPath();
        if (editorPath) {
          text = path.relative(path.dirname(editorPath), item.aPath);
        } else {
          text = item.fPath;
        }
      } else if (params.rel === "n") {
        text = path.basename(item.fPath);
      }
      if (this.insertSep === 1) {
        text = text.replace(/\\/g, "/");
      } else if (this.insertSep === 2) {
        text = text.replace(/\//g, "\\");
      }
      // insertSep === 0 means default (no change)
      if (params.op === "insert") {
        if (!editor) {
          editor = atom.workspace.getActiveTextEditor();
        }
        if (!editor) {
          atom.notifications.addError(
            "Cannot insert path, because there is no active text editor"
          );
          return;
        }
        editor.insertText(text, { select: true });
      } else if (params.op === "copy") {
        clipboard.writeText(text);
      }
    } else if (mode === "clip") {
      if (!this.windowsClipService) {
        atom.notifications.addWarning(
          "Windows clipboard service not available",
          {
            detail:
              "The windows-clip package is required for Cut/Copy file operations",
          }
        );
        return;
      }
      aPath = item.aPath;
      if (params.effect === "cut") {
        this.windowsClipService.writeFilePaths(
          [aPath],
          this.windowsClipService.DROP_EFFECT_MOVE
        );
        atom.notifications.addSuccess("File cut to clipboard", {
          detail: aPath,
        });
      } else if (params.effect === "copy") {
        this.windowsClipService.writeFilePaths(
          [aPath],
          this.windowsClipService.DROP_EFFECT_COPY
        );
        atom.notifications.addSuccess("File copied to clipboard", {
          detail: aPath,
        });
      }
    } else if (mode === "claude-chat") {
      if (!this.claudeChatService) {
        atom.notifications.addWarning("claude-chat service not available");
        return;
      }
      const context = {
        type: "paths",
        paths: [item.fPath],
        label: item.fPath,
        icon: "file",
      };
      if (!this.claudeChatService.setFocusContext(context)) {
        atom.notifications.addWarning("No active claude-chat panel");
      }
    }
  }

  parseQuery(query) {
    if (query.length === 0) {
      this.qunum = 0;
      return query;
    }
    let colon = query.indexOf(":");
    if (colon !== -1) {
      let qunumRaw = query.substring(colon + 1);
      this.qunum = qunumRaw.match(/^\d+$/) ? parseInt(qunumRaw) - 1 : 0;
      return query.slice(0, colon);
    }
    this.qunum = 0;
    return query;
  }

  refresh() {
    this.S.pathData.loadQ = true;
    this.update();
  }

  update() {
    if (this.S.pathData.loadQ) {
      this.selectList.update({
        items: [],
        loadingMessage: "Indexing project\u2026",
      });
      this.S.pathData.cache(() => {
        this.S.pathData.viewQ = true;
        this.selectList.update({
          items: this.S.pathData.items,
          loadingMessage: null,
        });
      });
    } else if (!this.S.pathData.viewQ) {
      this.S.pathData.viewQ = true;
      this.S.pathData.relativize();
      this.selectList.update({ items: this.S.pathData.items });
    } else {
      this.S.pathData.relativize();
    }
  }

  updateQueryFromItem() {
    let text = this.selectList.getSelectedItem().fPath + path.sep;
    this.selectList.refs.queryEditor.setText(text);
    this.selectList.refs.queryEditor.moveToEndOfLine();
  }
};
