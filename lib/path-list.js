'use babel'
/** @jsx etch.dom */

import etch from 'etch'
import { CompositeDisposable } from 'atom'
import SelectListView from 'atom-select-list'
import zadeh from "zadeh"
import { shell, clipboard } from 'electron'
import path from 'path'
import fs from 'fs'
import Diacritics from 'diacritic'
import { ObjectArrayFilterer } from 'zadeh'

export default class PathList {

  constructor(S) {
    this.S = S
    this.objectArrayFilterer = new ObjectArrayFilterer() ; this.query = ''
    this.slist = new SelectListView({
      items: [],
      maxResults: this.getMaxResults(),
      emptyMessage: this.getEmptyMessage(),
      elementForItem: this.elementForItem.bind(this),
      didConfirmSelection: () => { this.didConfirmSelection.bind(this)('open') },
      didCancelSelection: this.didCancelSelection.bind(this),
      filter: this.filter.bind(this),
      didChangeQuery: (query) => { this.query = Diacritics.clean(query) }
    })
    this.slist.element.classList.add('fuzzy-files')
    this.slist.element.classList.add('command-palette')
    this.disposables = new CompositeDisposable()
    this.disposables.add(
      atom.config.observe('command-palette.preserveLastSearch', (value) => {
        this.preserveLastSearch = value
      }),
      atom.config.observe('fuzzy-files.showKeystrokes', (value) => {
        this.showKeystrokes = value
        this.slist.update({infoMessage:this.getInfoMessage()})
      }),
      atom.commands.add(this.slist.element, {
        'fuzzy-files:query-selection': () => this.updateQueryFromSelection(),
      }),
      atom.config.observe('fuzzy-files.insertSep', (value) => {
        this.insertSep = value
      }),
      atom.commands.add('atom-workspace', {
        'fuzzy-files:toggle' : () => this.toggle(),
      }),
      atom.commands.add(this.slist.element, {
        'fuzzy-files:query-item'     : () => this.updateQueryFromItem(),
        'fuzzy-files:open'           : () => this.didConfirmSelection('open'),
        'fuzzy-files:open-externally': () => this.didConfirmSelection('open-externally'),
        'fuzzy-files:show-in-folder' : () => this.didConfirmSelection('show-in-folder'),
        'fuzzy-files:trash'          : () => this.didConfirmSelection('trash'),
        'fuzzy-files:split-left'     : () => this.didConfirmSelection('split', {side:'left' }),
        'fuzzy-files:split-right'    : () => this.didConfirmSelection('split', {side:'right'}),
        'fuzzy-files:split-up'       : () => this.didConfirmSelection('split', {side:'up'   }),
        'fuzzy-files:split-down'     : () => this.didConfirmSelection('split', {side:'down' }),
        'fuzzy-files:insert-p'       : () => this.didConfirmSelection('path', {op:'insert', rel:'p'}),
        'fuzzy-files:insert-a'       : () => this.didConfirmSelection('path', {op:'insert', rel:'a'}),
        'fuzzy-files:insert-r'       : () => this.didConfirmSelection('path', {op:'insert', rel:'r'}),
        'fuzzy-files:insert-n'       : () => this.didConfirmSelection('path', {op:'insert', rel:'n'}),
        'fuzzy-files:copy-p'         : () => this.didConfirmSelection('path', {op:'copy', rel:'p'}),
        'fuzzy-files:copy-a'         : () => this.didConfirmSelection('path', {op:'copy', rel:'a'}),
        'fuzzy-files:copy-r'         : () => this.didConfirmSelection('path', {op:'copy', rel:'r'}),
        'fuzzy-files:copy-n'         : () => this.didConfirmSelection('path', {op:'copy', rel:'n'}),
        'fuzzy-files:delete'         : () => this.didConfirmSelection('delete'),
        'fuzzy-files:default-slash'  : () => {
          atom.config.set('fuzzy-files.insertSep', 0)
          atom.notifications.addSuccess('Separator has been changed to default')
        },
        'fuzzy-files:forward-slash': () => {
          atom.config.set('fuzzy-files.insertSep', 1)
          atom.notifications.addSuccess('Separator has been changed to forward slash')
        },
        'fuzzy-files:backslash': () => {
          atom.config.set('fuzzy-files.insertSep', 2)
          atom.notifications.addSuccess('Separator has been changed to backslash')
        },
      }),
    )
  }

  destroy() {
    this.disposables.dispose()
    if (this.panel) { this.panel.destroy() }
    this.slist.destroy()
  }

  getMaxResults() {
    return 50
  }

  getEmptyMessage() {
    return <div class='empty-message'>No matches found</div>
  }

  getInfoMessage() {
    return this.showKeystrokes ? ['Press ', <span class='keystroke'>Enter</span>, ', ', <span class='keystroke'>Alt|Ctrl-Enter</span>, ', ', <span class='keystroke'>Alt-Left|Right|Up|Down</span>, ', ', <span class='keystroke'>Alt-C|V Alt-P|A|R|N</span>, ', ', <span class='keystroke'>Alt-D</span>, ' or ', <span class='keystroke'>Alt-0|/|\|Q|S</span>] : null
  }

  show() {
    this.previouslyFocusedElement = document.activeElement
    if (this.preserveLastSearch) {
      this.slist.refs.queryEditor.selectAll()
    } else {
      this.slist.reset()
    }
    if (!this.panel) { this.panel = atom.workspace.addModalPanel({ item: this.slist }) }
    this.panel.show()
    this.slist.focus()
  }

  hide() {
    this.panel.hide()
    this.previouslyFocusedElement.focus()
  }

  toggle() {
    if (this.panel && this.panel.isVisible()) {
      this.hide()
    } else {
      this.update()
      this.show()
    }
  }

  highlightInElement(el, text, indices) {
    let matchedChars = []
    let lastIndex = 0
    for (const matchIndex of indices) {
      const unmatched = text.substring(lastIndex, matchIndex)
      if (unmatched) {
        if (matchedChars.length > 0) {
          const matchSpan = document.createElement('span')
          matchSpan.classList.add('character-match')
          matchSpan.textContent = matchedChars.join('')
          el.appendChild(matchSpan)
          matchedChars = []
        }
        el.appendChild(document.createTextNode(unmatched))
      }
      matchedChars.push(text[matchIndex])
      lastIndex = matchIndex + 1
    }
    if (matchedChars.length > 0) {
      const matchSpan = document.createElement('span')
      matchSpan.classList.add('character-match')
      matchSpan.textContent = matchedChars.join('')
      el.appendChild(matchSpan)
    }
    const unmatched = text.substring(lastIndex)
    if (unmatched) {
      el.appendChild(document.createTextNode(unmatched))
    }
  }

  updateQueryFromSelection() {
    const editor = atom.workspace.getActiveTextEditor()
    if (!editor) { return }
    const text = editor.getSelectedText()
    if (/\n/m.test(text)) { return }
    this.slist.refs.queryEditor.setText(text)
    this.slist.refs.queryEditor.setSelectedBufferRange([[0, 0], [0, text.length]])
  }

  didCancelSelection() {
    this.hide()
  }

  elementForItem (item, options) {
    let li = document.createElement('li')
    if (!options.visible) { return li }
    li.classList.add('event', 'two-lines')
    let priBlock = document.createElement('div')
    priBlock.classList.add('primary-line')
    let matches = this.query.length>0 ? zadeh.match(item.text, this.query) : []
    this.highlightInElement(priBlock, item.fPath, matches)
    let iconClass = this.S.getIconClass ? this.S.getIconClass(path.join(item.pPath, item.fPath)) : 'icon-file-text'
    priBlock.classList.add('icon', 'icon-line', ...iconClass)
    li.appendChild(priBlock)
    let secBlock = document.createElement('div')
    secBlock.classList.add('secondary-line')
    secBlock.innerHTML = item.pPath
    li.appendChild(secBlock)
    li.addEventListener('contextmenu', () => { this.slist.selectIndex(options.index) })
    return li
  }

  didConfirmSelection(mode, params) {
    let item = this.slist.getSelectedItem()
    if (!item) { return }
    let editor, aPath, text
    if (mode==='open') {
      aPath = path.join(item.pPath, item.fPath)
      try {
        if ((!fs.lstatSync(aPath).isFile())) {
          return this.updateQueryFromItem()
        }
      } catch (error) {
        atom.notifications.addError(error)
      }
    }
    this.hide()
    if (mode==='open') {
      aPath = path.join(item.pPath, item.fPath)
      atom.workspace.open(aPath)
    } else if (mode==='open-externally') {
      shell.openPath(path.join(item.pPath, item.fPath))
    } else if (mode==='show-in-folder') {
      shell.showItemInFolder(path.join(item.pPath, item.fPath))
    } else if (mode==='trash') {
      aPath = path.join(item.pPath, item.fPath)
      if (shell.moveItemToTrash(aPath)) {
        atom.notifications.addSuccess(`Item has been trashed\n"${aPath}"`)
      } else {
        atom.notifications.addError(`Item cannot be trashed\n "${aPath}"`)
      }
    } else if (mode==='split') {
      aPath = path.join(item.pPath, item.fPath)
      try {
        if (fs.lstatSync(aPath).isFile()) {
          atom.workspace.open(aPath, {split:params.side})
        } else {
          atom.notifications.addError(`Cannot open "${aPath}", because it's a dir`)
        }
      } catch (error) {
        atom.notifications.addError(error)
      }
    } else if (mode==='path') {
      if (params.rel==='p') {
        text = item.fPath
      } else if  (params.rel==='a') {
        text = path.join(item.pPath, item.fPath)
      } else if  (params.rel==='r') {
        editor = atom.workspace.getActiveTextEditor()
        if (!editor) {
          atom.notifications.addError('Cannot insert path, because there is no active text editor')
          return
        }
        let editorPath = editor.getPath()
        if (editorPath) {
          text = path.relative(path.dirname(editorPath), path.join(item.pPath, item.fPath))
        } else {
          text = item.fPath
        }
      } else if  (params.rel==='n') {
        text = path.basename(item.fPath)
      }
      if (this.insertSep===1) {
        text = text.replace(/\\/g, '/')
      } else if (this.insertSep===2) {
        text = text.replace(/\//g, '\\')
      }
      if (params.op==='insert') {
        if (!editor) {
          editor = atom.workspace.getActiveTextEditor()
        }
        if (!editor) {
          atom.notifications.addError('Cannot insert path, because there is no active text editor')
          return
        }
        editor.insertText(text, { select: true })
      } else if (params.op==='copy') {
        clipboard.writeText(text)
      }
    } else if (mode=='delete') {
      let itemPath = path.join(item.pPath, item.fPath)
      if (shell.moveItemToTrash(itemPath)) {
        atom.notifications.addSuccess(`Item has been moved to trash`, { detail:`${itemPath}` })
      } else {
        atom.notifications.addError(`Item has not been moved to trash`, { detail:`${itemPath}` })
      }
    }
  }

  filter (items) {
    if (this.query.length===0) { return items }
    items = this.objectArrayFilterer.filter(this.query, { maxResults: 1000 })
    let scoredItems = []
    for (let item of items) {
      item.score = zadeh.score(item.text, this.query)/item.distance
      scoredItems.push(item)
    }
    return scoredItems.sort((a,b) => b.score-a.score)
  }

  update() {
    if (this.S.pathData.loadQ) {
      this.slist.update({items:[], loadingMessage:[<span>{'Indexing project\u2026'}</span>, <span class='loading loading-spinner-tiny'/>], infoMessage:null})
      this.S.pathData.cache(() => {
        this.S.pathData.viewQ = true
        this.slist.update({items:this.S.pathData.items, loadingMessage:null, infoMessage:this.getInfoMessage()})
        this.objectArrayFilterer.setCandidates(this.S.pathData.items, 'text')
      })
    } else if (!this.S.pathData.viewQ) {
      this.S.pathData.viewQ = true
      this.S.pathData.relativize()
      this.slist.update({items:this.S.pathData.items})
      this.objectArrayFilterer.setCandidates(this.S.pathData.items, 'text')
    } else {
      this.S.pathData.relativize()
    }
  }

  updateQueryFromItem() {
    let text = this.slist.getSelectedItem().fPath
    this.slist.refs.queryEditor.setText(text+path.sep)
    this.slist.refs.queryEditor.moveToEndOfLine()
  }
}
