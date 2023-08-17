'use babel'

import { CompositeDisposable } from 'atom'
import zadeh from "zadeh"
import path from 'path'
import Diacritics from 'diacritic'

export default class PathProv {

  constructor(S) {
    this.S = S
    this.disposables = new CompositeDisposable()
    this.selector = '*';
		this.suggestionPriority = 999;
    this.disposables.add(
      atom.config.observe('fuzzy-files.autocompletePath', (value) => {
        this.autocompletePath = value
      }),
      atom.config.observe('fuzzy-files.insertSep', (value) => {
        this.insertSep = value
      }),
    )
  }

  dispose() {
    this.disposables.dispose()
  }

  getSuggestions(options) {
    if (!this.autocompletePath) { return }
		const { editor, bufferPosition } = options;
		let code = editor.getTextInRange([[bufferPosition.row, 0], bufferPosition]);
    let match = code.match(/\/\/\/(.*)$/)
		if (match) { return this.findMatchingSuggestions(match[1]) };
	}

	findMatchingSuggestions(query) {
    if (this.S.pathData.loadQ) { return }
		return this.filter(this.S.pathData.items, query).map((item) => {
      let aPath = path.join(item.pPath, item.fPath)
      let iconClass
      if (this.S.getIconClass) {
        iconClass = this.S.getIconClass(aPath).join(' ')
      } else {
        iconClass = 'default-icon'
      }
      let rPath = this.formatSep(item.rPath)
			return {
				text: rPath,
				displayText: rPath,
				replacementPrefix : `///${query}`,
        rightLabel: 'Path',
				className: 'constant',
        iconHTML: `<i class="${iconClass} icon"></i>`,
        description: aPath,
        characterMatchIndices: [],
			}
		})
	}

  filter(items, query) {
    if (query.length===0) {
      return items.filter( item => item.distance===1 )
    }
    query = Diacritics.clean(query)
    let scoredItems = []
    for (let item of items) {
      item.score = zadeh.score(Diacritics.clean(item.rPath), query)
      if (item.score<=0) { continue }
      item.score = item.score/item.distance
      scoredItems.push(item)
    }
    return scoredItems.sort((a,b) => b.score-a.score).slice(0, 10)
  }

  formatSep(text) {
    if (this.insertSep===0) {
      return text
    } else if (this.insertSep===1) {
      return text.replace(/\\/g, '/')
    } else if (this.insertSep===2) {
      return text.replace(/\//g, '\\')
    }
  }

}
