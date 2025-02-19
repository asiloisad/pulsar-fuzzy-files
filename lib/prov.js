const { CompositeDisposable } = require('atom')
const path = require('path')
const Diacritics = require('diacritic')

module.exports = class PathProv {

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
    if (this.S.pathData.loadQ) { this.S.pathData.cache() }
		return this.S.pathList.filter(this.S.pathData.items, query).map((item) => {
      let rPath = this.formatSep(item.rPath)
			return {
				text: rPath,
				displayText: rPath,
				replacementPrefix : `///${query}`,
        rightLabel: 'Path',
				className: 'constant',
        iconHTML: `<i class="icon ${this.S.iconClassForPath(item.aPath).join(' ')}" data-path="${item.aPath}" data-name="${item.nPath}"/>`,
        description: item.aPath,
        characterMatchIndices: [],
			}
		})
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
