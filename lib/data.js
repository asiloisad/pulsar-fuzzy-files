const { CompositeDisposable, Task } = require("atom");
const minimatch = require("minimatch");
const path = require("path");
const Diacritics = require("diacritic");

module.exports = class PathData {
  constructor(S) {
    this.S = S;
    this.ignores = [];
    this.Ignores = [];
    this.items = [];
    this.viewQ = false;
    this.loadQ = true;
    this.disposables = new CompositeDisposable();
    this.disposables.add(
      atom.commands.add("atom-workspace", {
        "fuzzy-files:update": () => this.cache(),
      }),
      atom.project.onDidChangeFiles((events) => {
        if (!this.loadQ) {
          this.updateEvent(events);
        }
      }),
      atom.project.onDidChangePaths(() => {
        this.loadQ = true;
      }),
      atom.config.onDidChange("core.ignoredNames", () => {
        this.loadQ = true;
      }),
      atom.config.onDidChange("fuzzy-files.ignoredNames", () => {
        this.loadQ = true;
      }),
      atom.workspace.onDidChangeActivePaneItem(() => {
        if (!this.loadQ) {
          this.relativize();
        }
      })
    );
  }

  destroy() {
    this.disposables.dispose();
  }

  parseIgnores() {
    // compability with fuzzy-finder
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
  }

  cache(callback) {
    this.parseIgnores();
    this.items = [];
    Promise.all(atom.project.getPaths().map(this.globPromise.bind(this))).then(
      (errs) => {
        this.viewQ = false;
        this.loadQ = false;
        this.relativize();
        if (callback) {
          callback(errs);
        }
      }
    );
  }

  globPromise(pPath) {
    return new Promise((resolve) => {
      const taskPath = require.resolve("./scan");
      const task = Task.once(taskPath, pPath, this.ignores);
      task.on("entries", (data) => {
        for (let fPath of data.entries) {
          if (fPath === ".") {
            continue;
          }
          let item = { pPath: pPath, fPath: path.normalize(fPath) };
          item.aPath = path.join(item.pPath, item.fPath);
          item.nPath = path.basename(item.fPath);
          item.text = Diacritics.clean(item.fPath);
          this.items.push(item);
        }
        resolve();
      });
    });
  }

  updateEvent(events) {
    this.viewQ = false;
    let pPath, fPath;
    for (let e of events) {
      if (e.action === "created") {
        [pPath, fPath] = atom.project.relativizePath(e.path);
        if (this.isIgnored(fPath)) {
          continue;
        }
        let item = { pPath: pPath, fPath: fPath };
        item.aPath = path.join(item.pPath, item.fPath);
        item.nPath = path.basename(item.fPath);
        item.text = Diacritics.clean(item.fPath);
        this.items.push(item);
      } else if (e.action === "deleted") {
        // if dir, then only main dir is reported. subfiles must be searched manually
        [pPath, fPath] = atom.project.relativizePath(e.path);
        if (!pPath) {
          continue;
        }
        // Use Set for O(1) lookup performance
        const removeSet = new Set();
        for (let i = 0; i < this.items.length; i++) {
          if (
            pPath === this.items[i].pPath &&
            (fPath === this.items[i].fPath ||
              this.items[i].fPath.startsWith(fPath + path.sep))
          ) {
            removeSet.add(i);
          }
        }
        // Remove in reverse order to maintain correct indices
        const removeIndexes = Array.from(removeSet).sort((a, b) => b - a);
        for (let i of removeIndexes) {
          this.items.splice(i, 1);
        }
      } else if (e.action === "renamed") {
        for (let item of this.items) {
          let [pOldPath, fOldPath] = atom.project.relativizePath(e.oldPath);
          let [pNewPath, fNewPath] = atom.project.relativizePath(e.path);
          if (
            pOldPath === item.pPath &&
            (fOldPath === item.fPath ||
              item.fPath.startsWith(fOldPath + path.sep))
          ) {
            item.pPath = pNewPath;
            item.fPath = item.fPath.replace(fOldPath, fNewPath);
            item.aPath = path.join(item.pPath, item.fPath);
            item.nPath = path.basename(item.fPath);
            item.text = Diacritics.clean(item.fPath);
          }
        }
      }
    }
  }

  relativize(editor) {
    if (!editor) {
      editor = atom.workspace.getActiveTextEditor();
    }
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
  }

  isIgnored(fPath) {
    for (let compiledPattern of this.Ignores) {
      if (compiledPattern.match(fPath)) {
        return true;
      }
    }
    return false;
  }
};
