/** @babel */
/** @jsx etch.dom */

const etch = require('etch')
const { CompositeDisposable } = require('atom')
const SelectListView = require('atom-select-list')
const { shell, clipboard } = require('electron')
const path = require('path')
const fs = require('fs')
const Diacritics = require('diacritic')

module.exports = class PathList {

  constructor(S) {
    this.S = S
    this.openExternalService = null
    this.query = ''
    this.qunum = 0
    this.slv = new SelectListView({
      items:
        [],
      maxResults:
        50,
      emptyMessage:
        <div class='empty-message'>No matches found</div>,
      elementForItem:
        this.elementForItem.bind(this),
      didConfirmSelection:
        () => { this.didConfirmSelection.bind(this)('open') },
      didCancelSelection:
        this.didCancelSelection.bind(this),
      filter:
        this.filter.bind(this),
    })
    this.slv.element.classList.add('fuzzy-files')
    this.slv.element.classList.add('command-palette')
    this.disposables = new CompositeDisposable()
    this.disposables.add(
      atom.config.observe('command-palette.preserveLastSearch', (value) => {
        this.preserveLastSearch = value
      }),
      atom.config.observe('fuzzy-files.showKeystrokes', (value) => {
        this.showKeystrokes = value
        this.slv.update({ infoMessage: this.getInfoMessage() })
      }),
      atom.commands.add(this.slv.element, {
        'fuzzy-files:query-selection': () => this.updateQueryFromSelection(),
      }),
      atom.config.observe('fuzzy-files.insertSep', (value) => {
        this.insertSep = value
      }),
      atom.commands.add('atom-workspace', {
        'fuzzy-files:toggle': () => this.toggle(),
      }),
      atom.commands.add(this.slv.element, {
        'fuzzy-files:query-item':
          () => this.updateQueryFromItem(),
        'fuzzy-files:open':
          () => this.didConfirmSelection('open'),
        'fuzzy-files:open-externally':
          () => this.didConfirmSelection('open-externally'),
        'fuzzy-files:show-in-folder':
          () => this.didConfirmSelection('show-in-folder'),
        'fuzzy-files:trash':
          () => this.didConfirmSelection('trash'),
        'fuzzy-files:split-left':
          () => this.didConfirmSelection('split', { side: 'left' }),
        'fuzzy-files:split-right':
          () => this.didConfirmSelection('split', { side: 'right' }),
        'fuzzy-files:split-up':
          () => this.didConfirmSelection('split', { side: 'up' }),
        'fuzzy-files:split-down':
          () => this.didConfirmSelection('split', { side: 'down' }),
        'fuzzy-files:insert-p':
          () => this.didConfirmSelection('path', { op: 'insert', rel: 'p' }),
        'fuzzy-files:insert-a':
          () => this.didConfirmSelection('path', { op: 'insert', rel: 'a' }),
        'fuzzy-files:insert-r':
          () => this.didConfirmSelection('path', { op: 'insert', rel: 'r' }),
        'fuzzy-files:insert-n':
          () => this.didConfirmSelection('path', { op: 'insert', rel: 'n' }),
        'fuzzy-files:copy-p':
          () => this.didConfirmSelection('path', { op: 'copy', rel: 'p' }),
        'fuzzy-files:copy-a':
          () => this.didConfirmSelection('path', { op: 'copy', rel: 'a' }),
        'fuzzy-files:copy-r':
          () => this.didConfirmSelection('path', { op: 'copy', rel: 'r' }),
        'fuzzy-files:copy-n':
          () => this.didConfirmSelection('path', { op: 'copy', rel: 'n' }),
        'fuzzy-files:update':
          () => this.refresh(),
        'fuzzy-files:default-slash': () => {
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
      atom.project.onDidChangePaths((projectPaths) => {
        this.projectCount = projectPaths.length
      }),
    )
    this.projectCount = atom.project.getPaths().length
  }

  destroy() {
    this.disposables.dispose()
    if (this.panel) { this.panel.destroy() }
    this.slv.destroy()
  }

  setOpenExternalService(service) {
    this.openExternalService = service
  }

  getInfoMessage() {
    if (!this.showKeystrokes) { return }
    return [
      'Press ',
      <span class='keystroke'>Enter</span>,
      ', ',
      <span class='keystroke'>Alt|Ctrl-Enter</span>,
      ', ',
      <span class='keystroke'>Alt-Left|Right|Up|Down</span>,
      ', ',
      <span class='keystroke'>Alt-C|V Alt-P|A|R|N</span>,
      ', ',
      <span class='keystroke'>Alt-D</span>,
      ' or ',
      <span class='keystroke'>Alt-0|/|\|Q|S</span>,
    ]
  }

  show() {
    this.previouslyFocusedElement = document.activeElement
    if (this.preserveLastSearch) {
      this.slv.refs.queryEditor.selectAll()
    } else {
      this.slv.reset()
    }
    if (!this.panel) {
      this.panel = atom.workspace.addModalPanel({ item: this.slv })
    }
    this.panel.show()
    this.slv.focus()
  }

  hide() {
    this.panel.hide()
    if (this.previouslyFocusedElement) {
      this.previouslyFocusedElement.focus()
      this.previouslyFocusedElement = null
    }
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
    this.slv.refs.queryEditor.setText(text)
    this.slv.refs.queryEditor.setSelectedBufferRange(
      [[0, 0], [0, text.length]]
    )
  }

  didCancelSelection() {
    this.hide()
  }

  elementForItem(item, options) {
    let li = document.createElement('li')
    if (!options.visible) { return li }
    li.classList.add('event', 'two-lines')
    let priBlock = document.createElement('div')
    priBlock.classList.add('primary-line')
    priBlock.setAttribute('data-path', item.aPath)
    priBlock.setAttribute('data-name', item.nPath)
    let matches = this.query.length > 0 ? atom.ui.fuzzyMatcher.match(
      item.text, this.query, { recordMatchIndexes: true }).matchIndexes : []
    this.highlightInElement(priBlock, item.fPath, matches)
    priBlock.classList.add('icon', 'icon-line', ...this.S.iconClassForPath(item.aPath))
    li.appendChild(priBlock)
    if (this.projectCount > 1) {
      let secBlock = document.createElement('div')
      secBlock.classList.add('secondary-line')
      secBlock.innerHTML = item.pPath
      li.appendChild(secBlock)
    }
    li.addEventListener('contextmenu', () => { this.slv.selectIndex(options.index) })
    return li
  }

  didConfirmSelection(mode, params) {
    let item = this.slv.getSelectedItem()
    if (!item) { return }
    let editor, aPath, text
    if (mode === 'open') {
      aPath = item.aPath
      try {
        if ((!fs.lstatSync(aPath).isFile())) {
          return this.updateQueryFromItem()
        }
      } catch (error) {
        atom.notifications.addError(error)
      }
    }
    this.hide()
    if (mode === 'open') {
      aPath = item.aPath
      atom.workspace.open(aPath, { initialLine: this.qunum })
    } else if (mode === 'open-externally') {
      // Use open-external service if available, fallback to shell
      if (this.openExternalService) {
        this.openExternalService.openExternal(item.aPath)
      } else {
        shell.openPath(item.aPath)
      }
    } else if (mode === 'show-in-folder') {
      // Use open-external service if available, fallback to shell
      if (this.openExternalService) {
        this.openExternalService.showInFolder(item.aPath)
      } else {
        shell.showItemInFolder(item.aPath)
      }
    } else if (mode === 'trash') {
      aPath = item.aPath
      if (shell.moveItemToTrash) {
        if (shell.moveItemToTrash(aPath)) {
          atom.notifications.addSuccess('Item has been trashed', { detail: aPath })
        } else {
          atom.notifications.addError('Item cannot be trashed', { detail: aPath })
        }
      } else {
        atom.trashItem(aPath)
          .then((resolved, rejected) => {
            if (rejected) {
              atom.notifications.addError('Item cannot be trashed', { detail: aPath })
            } else {
              atom.notifications.addSuccess('Item has been trashed', { detail: aPath })
            }
          })
      }
    } else if (mode === 'split') {
      aPath = item.aPath
      try {
        if (fs.lstatSync(aPath).isFile()) {
          atom.workspace.open(aPath, { initialLine: this.qunum, split: params.side })
        } else {
          atom.notifications.addError(`Cannot open path, because it's a dir`, { detail: aPath })
        }
      } catch (error) {
        atom.notifications.addError(error)
      }
    } else if (mode === 'path') {
      if (params.rel === 'p') {
        text = item.fPath
      } else if (params.rel === 'a') {
        text = item.aPath
      } else if (params.rel === 'r') {
        editor = atom.workspace.getActiveTextEditor()
        if (!editor) {
          atom.notifications.addError('Cannot insert path, because there is no active text editor')
          return
        }
        let editorPath = editor.getPath()
        if (editorPath) {
          text = path.relative(path.dirname(editorPath), item.aPath)
        } else {
          text = item.fPath
        }
      } else if (params.rel === 'n') {
        text = path.basename(item.fPath)
      }
      if (this.insertSep === 1) {
        text = text.replace(/\\/g, '/')
      } else if (this.insertSep === 2) {
        text = text.replace(/\//g, '\\')
      }
      if (params.op === 'insert') {
        if (!editor) {
          editor = atom.workspace.getActiveTextEditor()
        }
        if (!editor) {
          atom.notifications.addError('Cannot insert path, because there is no active text editor')
          return
        }
        editor.insertText(text, { select: true })
      } else if (params.op === 'copy') {
        clipboard.writeText(text)
      }
    }
  }

  filter(items, query) {
    if (query.length === 0) {
      this.query = query
      this.qunum = 0
      return items
    }
    query = Diacritics.clean(query)
    let colon = query.indexOf(':')
    if (colon !== -1) {
      this.query = query.slice(0, colon)
      let qunumRaw = query.substring(colon + 1)
      this.qunum = qunumRaw.match(/^\d+$/) ? parseInt(qunumRaw) - 1 : 0
    } else {
      this.query = query
      this.qunum = 0
    }
    let scoredItems = []
    for (let item of items) {
      item.score = atom.ui.fuzzyMatcher.score(item.text, this.query) / item.distance
      // Short-circuit on very low scores to improve performance
      if (item.score > 0.01) { scoredItems.push(item) }
    }
    return scoredItems.sort((a, b) => b.score - a.score)
  }

  refresh() {
    this.S.pathData.loadQ = true
    this.update()
  }

  update() {
    if (this.S.pathData.loadQ) {
      this.slv.update({
        items: [],
        loadingMessage: [
          <span>{'Indexing project\u2026'}</span>,
          <span class='loading loading-spinner-tiny' />
        ],
        infoMessage: null
      })
      this.S.pathData.cache(() => {
        this.S.pathData.viewQ = true
        this.slv.update({
          items: this.S.pathData.items,
          loadingMessage: null,
          infoMessage: this.getInfoMessage()
        })
      })
    } else if (!this.S.pathData.viewQ) {
      this.S.pathData.viewQ = true
      this.S.pathData.relativize()
      this.slv.update({ items: this.S.pathData.items })
    } else {
      this.S.pathData.relativize()
    }
  }

  updateQueryFromItem() {
    let text = this.slv.getSelectedItem().fPath
    this.slv.refs.queryEditor.setText(text + path.sep)
    this.slv.refs.queryEditor.moveToEndOfLine()
  }
}
