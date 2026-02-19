const { CompositeDisposable, Disposable } = require("atom");
const { fork } = require("child_process");
const { SelectListView, createTwoLineItem, highlightMatches } = require("pulsar-select-list");
const { shell, clipboard } = require("electron");
const minimatch = require("minimatch");
const path = require("path");
const fs = require("fs");

module.exports = {
  fileIconsService: null,
  openExternalService: null,
  windowsClipService: null,
  claudeChatService: null,
  scoreModifiers: [],
  ignores: [],
  Ignores: [],
  items: [],
  viewSynced: false,
  needRebuild: true,
  building: false,
  selectList: null,
  disposables: null,
  separator: 0,
  initialLine: 0,
  projectCount: 0,

  activate() {
    atom.packages.disablePackage("fuzzy-finder");

    this.projectCount = atom.project.getPaths().length;

    this.selectList = new SelectListView({
      className: "fuzzy-files",
      maxResults: 50,
      emptyMessage: "No matches found",
      removeDiacritics: true,
      algorithm: "command-t",
      loadingSpinner: true,
      elementForItem: (item, options) => this.elementForItem(item, options),
      didConfirmSelection: () => this.performAction("open"),
      didCancelSelection: () => this.selectList.hide(),
      willShow: () => this.update(),
      filterKeyForItem: (item) => item.fPath,
      filterQuery: (query) => this.parseQuery(query),
      filterScoreModifier: (score, item) => {
        const depth = (item.fPath.match(/[\\/]/g) || []).length + 1;
        score = score / (item.distance * Math.sqrt(depth));
        for (const fn of this.scoreModifiers) {
          score = fn(score, item);
        }
        return score;
      },
    });

    this.disposables = new CompositeDisposable(
      atom.config.observe("fuzzy-files.separator", (value) => {
        this.separator = value;
      }),
      atom.commands.add("atom-workspace", {
        "fuzzy-files:toggle": () => this.selectList.toggle(),
        "fuzzy-files:update": () => this.cache(),
      }),
      atom.commands.add(this.selectList.element, {
        "select-list:query-item": () => this.updateQueryFromItem(),
        "select-list:open": () => this.performAction("open"),
        "select-list:open-external": () => this.performAction("open-external"),
        "select-list:show-in-folder": () => this.performAction("show-in-folder"),
        "select-list:trash": () => this.performAction("trash"),
        "select-list:split-left": () => this.performAction("split", { side: "left" }),
        "select-list:split-right": () => this.performAction("split", { side: "right" }),
        "select-list:split-up": () => this.performAction("split", { side: "up" }),
        "select-list:split-down": () => this.performAction("split", { side: "down" }),
        "select-list:insert-p": () => this.performAction("path", { op: "insert", rel: "p" }),
        "select-list:insert-a": () => this.performAction("path", { op: "insert", rel: "a" }),
        "select-list:insert-r": () => this.performAction("path", { op: "insert", rel: "r" }),
        "select-list:insert-n": () => this.performAction("path", { op: "insert", rel: "n" }),
        "select-list:copy-p": () => this.performAction("path", { op: "copy", rel: "p" }),
        "select-list:copy-a": () => this.performAction("path", { op: "copy", rel: "a" }),
        "select-list:copy-r": () => this.performAction("path", { op: "copy", rel: "r" }),
        "select-list:copy-n": () => this.performAction("path", { op: "copy", rel: "n" }),
        "select-list:update": () => this.refresh(),
        "select-list:default-slash": () => {
          atom.config.set("fuzzy-files.separator", 0);
          atom.notifications.addSuccess("Separator has been changed to default");
        },
        "select-list:forward-slash": () => {
          atom.config.set("fuzzy-files.separator", 1);
          atom.notifications.addSuccess("Separator has been changed to forward slash");
        },
        "select-list:backslash": () => {
          atom.config.set("fuzzy-files.separator", 2);
          atom.notifications.addSuccess("Separator has been changed to backslash");
        },
        "select-list:cut-file": () => this.performAction("clip", { effect: "cut" }),
        "select-list:copy-file": () => this.performAction("clip", { effect: "copy" }),
        "select-list:query-selection": () => this.selectList.setQueryFromSelection(),
        "select-list:claude-chat": () => this.performAction("claude-chat"),
      }),
      atom.project.onDidChangeFiles((events) => {
        if (!this.needRebuild) this.updateEvent(events);
      }),
      atom.project.onDidChangePaths((projectPaths) => {
        this.projectCount = projectPaths.length;
        this.needRebuild = true;
      }),
      atom.config.onDidChange("core.ignoredNames", () => {
        this.needRebuild = true;
      }),
      atom.config.onDidChange("fuzzy-files.ignoredNames", () => {
        this.needRebuild = true;
      }),
      atom.workspace.onDidChangeActivePaneItem(() => {
        if (!this.needRebuild) this.relativize();
      }),
    );
  },

  deactivate() {
    this.disposables.dispose();
    this.selectList.destroy();
  },

  parseIgnores() {
    this.ignores = [];
    this.Ignores = [];
    for (let ignore of atom.config.get("core.ignoredNames")) {
      this.ignores.push(ignore);
      this.ignores.push("**/" + ignore + "/**");
    }
    for (let ignore of atom.config.get("fuzzy-files.ignoredNames")) {
      this.ignores.push(ignore);
      this.ignores.push("**/" + ignore + "/**");
    }
    const Minimatch = minimatch.Minimatch;
    for (let ignore of this.ignores) {
      this.Ignores.push(new Minimatch(ignore, { matchBase: true, dot: true }));
    }
  },

  cache(callback) {
    if (this.building) return;
    this.building = true;
    this.parseIgnores();
    this.items = [];
    Promise.all(atom.project.getPaths().map((p) => this.globPromise(p))).then((errs) => {
      this.building = false;
      this.viewSynced = false;
      this.needRebuild = false;
      this.relativize();
      if (callback) callback(errs);
    });
  },

  globPromise(pPath) {
    return new Promise((resolve, reject) => {
      const child = fork(require.resolve("./scan"), { silent: true });
      child.send({ projectPath: pPath, ignores: this.ignores });
      child.on("message", (data) => {
        for (let fPath of data.entries) {
          if (fPath === ".") continue;
          let item = { pPath: pPath, fPath: path.normalize(fPath) };
          item.aPath = path.join(item.pPath, item.fPath);
          item.nPath = path.basename(item.fPath);
          this.items.push(item);
        }
        resolve();
      });
      child.on("error", reject);
    });
  },

  updateEvent(events) {
    this.viewSynced = false;
    let pPath, fPath;
    for (let e of events) {
      if (e.action === "created") {
        [pPath, fPath] = atom.project.relativizePath(e.path);
        if (this.isIgnored(fPath)) continue;
        let item = { pPath: pPath, fPath: fPath };
        item.aPath = path.join(item.pPath, item.fPath);
        item.nPath = path.basename(item.fPath);
        this.items.push(item);
      } else if (e.action === "deleted") {
        [pPath, fPath] = atom.project.relativizePath(e.path);
        if (!pPath) continue;
        this.invalidateIcon(e.path);
        this.items = this.items.filter(
          (item) =>
            !(
              pPath === item.pPath &&
              (fPath === item.fPath || item.fPath.startsWith(fPath + path.sep))
            ),
        );
      } else if (e.action === "renamed") {
        let [pOldPath, fOldPath] = atom.project.relativizePath(e.oldPath);
        let [pNewPath, fNewPath] = atom.project.relativizePath(e.path);
        this.invalidateIcon(e.oldPath);
        for (let item of this.items) {
          if (
            pOldPath === item.pPath &&
            (fOldPath === item.fPath || item.fPath.startsWith(fOldPath + path.sep))
          ) {
            item.pPath = pNewPath;
            item.fPath = item.fPath.replace(fOldPath, fNewPath);
            item.aPath = path.join(item.pPath, item.fPath);
            item.nPath = path.basename(item.fPath);
          }
        }
      }
    }
  },

  relativize(editor) {
    if (!editor) editor = atom.workspace.getActiveTextEditor();
    let editorPath = editor ? editor.getPath() : undefined;
    if (!editor || !editorPath) {
      for (let item of this.items) {
        item.rPath = item.fPath;
        item.distance = 1;
      }
    } else {
      for (let item of this.items) {
        item.rPath = path.relative(path.dirname(editorPath), item.aPath);
        let match = item.rPath.match(/[\\/\\]/g);
        item.distance = match ? match.length + 1 : 1;
      }
    }
  },

  isIgnored(fPath) {
    for (let compiledPattern of this.Ignores) {
      if (compiledPattern.match(fPath)) return true;
    }
    return false;
  },

  elementForItem(item, { matchIndices }) {
    const li = createTwoLineItem({
      primary: highlightMatches(item.fPath, matchIndices),
      secondary: this.projectCount > 1 ? item.pPath : undefined,
      icon: this.iconClassForPath(item.aPath),
    });
    li.firstChild.dataset.name = path.basename(item.aPath);
    return li;
  },

  parseQuery(query) {
    if (query.length === 0) {
      this.initialLine = 0;
      return query;
    }
    let colon = query.indexOf(":");
    if (colon !== -1) {
      let initialLineRaw = query.substring(colon + 1);
      this.initialLine = initialLineRaw.match(/^\d+$/) ? parseInt(initialLineRaw) - 1 : 0;
      return query.slice(0, colon);
    }
    this.initialLine = 0;
    return query;
  },

  getHelpMarkdown() {
    return (
      "Available commands:\n" +
      "- **Enter** — Open file\n" +
      "- **Ctrl+Enter** — Open externally\n" +
      "- **Alt+Enter** — Show in folder\n" +
      "- **Alt+Left|Right|Up|Down** — Split pane\n" +
      "- **Alt+C P|A|R|N** — Copy path\n" +
      "- **Alt+V P|A|R|N** — Insert path\n" +
      "- **Alt+Delete** — Trash file\n" +
      "- **Alt+Q|S** — Query from item|selection\n" +
      "- **Alt+0|/|\\\\** — Set path separator\n" +
      "- **Alt+F** — Attach to claude-chat\n" +
      "- **Alt+W Alt+C|X** — Copy/cut file\n\n" +
      `**${this.items.length}** files in **${this.projectCount}** project${
        this.projectCount !== 1 ? "s" : ""
      }`
    );
  },

  update() {
    if (this.needRebuild) {
      this.selectList.update({
        items: [],
        loadingMessage: "Indexing project\u2026",
      });
      this.cache(() => {
        this.viewSynced = true;
        this.selectList.update({
          items: this.items,
          loadingMessage: null,
          helpMarkdown: this.getHelpMarkdown(),
        });
      });
    } else if (!this.viewSynced) {
      this.viewSynced = true;
      this.relativize();
      this.selectList.update({
        items: this.items,
        helpMarkdown: this.getHelpMarkdown(),
      });
    } else {
      this.relativize();
    }
  },

  refresh() {
    this.needRebuild = true;
    this.update();
  },

  updateQueryFromItem() {
    let text = this.selectList.getSelectedItem().fPath + path.sep;
    this.selectList.refs.queryEditor.setText(text);
    this.selectList.refs.queryEditor.moveToEndOfLine();
  },

  performAction(mode, params) {
    let item = this.selectList.getSelectedItem();
    if (!item) return;

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

    this.selectList.hide();

    if (mode === "open") {
      atom.workspace.open(item.aPath, { initialLine: this.initialLine });
    } else if (mode === "open-external") {
      if (this.openExternalService) {
        this.openExternalService.openExternal(item.aPath);
      } else {
        shell.openPath(item.aPath);
      }
    } else if (mode === "show-in-folder") {
      if (this.openExternalService) {
        this.openExternalService.showInFolder(item.aPath);
      } else {
        shell.showItemInFolder(item.aPath);
      }
    } else if (mode === "trash") {
      aPath = item.aPath;
      if (atom.trashItem) {
        atom
          .trashItem(aPath)
          .then(() =>
            atom.notifications.addSuccess("Item has been trashed", {
              detail: aPath,
            }),
          )
          .catch(() =>
            atom.notifications.addError("Item cannot be trashed", {
              detail: aPath,
            }),
          );
      } else if (shell.moveItemToTrash) {
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
            initialLine: this.initialLine,
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
          atom.notifications.addError("Cannot insert path, because there is no active text editor");
          return;
        }
        let editorPath = editor.getPath();
        text = editorPath ? path.relative(path.dirname(editorPath), item.aPath) : item.fPath;
      } else if (params.rel === "n") {
        text = path.basename(item.fPath);
      }
      if (this.separator === 1) {
        text = text.replace(/\\/g, "/");
      } else if (this.separator === 2) {
        text = text.replace(/\//g, "\\");
      }
      if (params.op === "insert") {
        if (!editor) editor = atom.workspace.getActiveTextEditor();
        if (!editor) {
          atom.notifications.addError("Cannot insert path, because there is no active text editor");
          return;
        }
        editor.insertText(text, { select: true });
      } else if (params.op === "copy") {
        clipboard.writeText(text);
      }
    } else if (mode === "clip") {
      if (!this.windowsClipService) {
        atom.notifications.addWarning("Windows clipboard service not available", {
          detail: "The windows-clip package is required for Cut/Copy file operations",
        });
        return;
      }
      aPath = item.aPath;
      if (params.effect === "cut") {
        this.windowsClipService.writeFilePaths([aPath], this.windowsClipService.DROP_EFFECT_MOVE);
        atom.notifications.addSuccess("File cut to clipboard", {
          detail: aPath,
        });
      } else if (params.effect === "copy") {
        this.windowsClipService.writeFilePaths([aPath], this.windowsClipService.DROP_EFFECT_COPY);
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
  },

  iconClassForPath(filePath) {
    if (!this.fileIconsService) {
      this.fileIconsService = require("./icon");
    }
    return this.fileIconsService(filePath);
  },

  invalidateIcon(filePath) {
    if (!this.fileIconsService) {
      this.fileIconsService = require("./icon");
    }
    if (this.fileIconsService.invalidate) {
      this.fileIconsService.invalidate(filePath);
    }
  },

  provideScoreModifier() {
    return {
      add: (fn) => {
        this.scoreModifiers.push(fn);
        return new Disposable(() => {
          const i = this.scoreModifiers.indexOf(fn);
          if (i !== -1) this.scoreModifiers.splice(i, 1);
        });
      },
    };
  },

  consumeClassIcons(object) {
    this.fileIconsService = object.iconClassForPath;
  },

  consumeOpenExternalService(service) {
    this.openExternalService = service;
    return {
      dispose: () => {
        this.openExternalService = null;
      },
    };
  },

  consumeWindowsClip(service) {
    this.windowsClipService = service;
    return {
      dispose: () => {
        this.windowsClipService = null;
      },
    };
  },

  consumeClaudeChat(service) {
    this.claudeChatService = service;
    return {
      dispose: () => {
        this.claudeChatService = null;
      },
    };
  },
};
