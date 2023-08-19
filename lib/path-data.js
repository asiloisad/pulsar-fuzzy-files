'use babel'

import { CompositeDisposable, Task } from 'atom'
import glob from 'glob'
import minimatch from "minimatch"
import path from 'path'
import Diacritics from 'diacritic'

export default class PathData {

  constructor(S) {
    this.S = S
    this.ignores = []
    this.items = []
    this.viewQ = false
    this.loadQ = true
    this.disposables = new CompositeDisposable()
    this.disposables.add(
      atom.commands.add('atom-workspace', {
        'fuzzy-files:update' : () => this.cache(),
      }),
      atom.project.onDidChangeFiles( (events) => { if (!this.loadQ) {this.updateEvent(events)} } ),
      atom.project.onDidChangePaths( () => { this.loadQ = true } ),
      atom.config.onDidChange('core.ignoredNames', () => { this.loadQ = true } ),
      atom.config.onDidChange('fuzzy-files.ignoredNames', () => { this.loadQ = true } ),
      atom.workspace.onDidChangeActivePaneItem( () => { if (!this.loadQ) this.relativize() } )
    )
  }

  destroy() {
    this.disposables.dispose()
  }

  cache(callback) {
    this.ignores = [
      ...atom.config.get('core.ignoredNames'),
      ...atom.config.get('fuzzy-files.ignoredNames'),
    ]
    this.items = []
    Promise.all(atom.project.getPaths().map(this.globPromise.bind(this))).then((errs) => {
      this.viewQ = false
      this.loadQ = false
      this.relativize()
      if (callback) {callback(errs)}
    })
  }

  globPromise(pPath) {
    return new Promise((resolve) => {
      const taskPath = require.resolve('./path-scan')
      const task = Task.once(taskPath, pPath, this.ignores)
      task.on('fuzzy-files:entries', (data) => {
        for (let fPath of data.entries) {
          if (fPath==='.') { continue }
          let item = { pPath: pPath, fPath: path.normalize(fPath) }
          item.text = Diacritics.clean(item.fPath)
          this.items.push(item)
        }
        resolve()
      })
    })
  }

  updateEvent(events) {
    this.viewQ = false
    let pPath, fPath
    for (let e of events) {
      if (e.action==='created') {
        [pPath, fPath] = atom.project.relativizePath(e.path)
        if (this.isIgnored(fPath)) {continue}
        let item = { pPath:pPath, fPath:fPath }
        item.text = Diacritics.clean(item.fPath)
        this.items.push(item)
      } else if (e.action==='deleted') {
        // if dir, then only main dir is reported. subfiles must be searched manually
        [pPath, fPath] = atom.project.relativizePath(e.path)
        if (!pPath) {continue}
        let removeIndexes = []
        for (var i=0; i<this.items.length; i++){
          if (pPath===this.items[i].pPath && (fPath===this.items[i].fPath || this.items[i].fPath.startsWith(fPath+path.sep))) {
            removeIndexes.push(i)
          }
        }
        for (var i = removeIndexes.length-1; i >= 0; i--) {
          this.items.splice(removeIndexes[i], 1);
        }
      } else if (e.action==='renamed') {
        for (let item of this.items) {
          let [pOldPath, fOldPath] = atom.project.relativizePath(e.oldPath)
          let [pNewPath, fNewPath] = atom.project.relativizePath(e.path)
          if (pOldPath===item.pPath && (fOldPath===item.fPath || item.fPath.startsWith(fOldPath+path.sep))) {
            item.pPath = pNewPath
            item.fPath = item.fPath.replace(fOldPath, fNewPath)
            item.text = Diacritics.clean(item.fPath)
          }
        }
      }
    }
  }

  relativize(editor) {
    if (!editor) { editor = atom.workspace.getActiveTextEditor()}
    let editorPath = editor ? editor.getPath() : undefined
    if (!editor || !editorPath) {
      for (let item of this.items) {
        item.rPath = item.fPath
        item.distance = 1
      }
    } else {
      for (let item of this.items) {
        item.rPath = path.relative(path.dirname(editorPath), path.join(item.pPath, item.fPath))
        let match = item.rPath.match(/[\/\\]/g)
        item.distance = match ? match.length+1 : 1
      }
    }
  }

  isIgnored(fPath) {
    for (let ignore of this.ignores) {
      if (minimatch(fPath, ignore)) {return true}
    }
    return false
  }
}
