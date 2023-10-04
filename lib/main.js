'use babel'

import PathList from './path-list'
import PathData from './path-data'
import PathProv from './path-prov'

export default {

  config: {
    ignoredNames: {
      order: 1,
      title: 'List of ignore glob patterns',
      description: "Files and directories matching these patterns will be ignored. This list is merged with the list defined by the core `Ignored Names` config setting. Example: `**/.git/**, **/__pycache__/**`.",
      type: 'array',
      items: {
        type: 'string',
      },
      default: ['**/.git/**', '**/.dev/**', '**/__pycache__/**'],
    },
    insertSep: {
      order: 2,
      title: 'Type of separator in file paths',
      description: 'Type of separator for the file path when copying or pasting',
      type: 'integer',
      default: 0,
      enum: [
        {value: 0, description: 'Default'},
        {value: 1, description: 'Forward Slash'},
        {value: 2, description: 'Backslash'},
      ],
    },
    autocompletePath: {
      order: 3,
      title: 'Enable path autocomplete',
      description: 'Enable autocomplete paths in the text editor. To call the hint type `///`',
      type: 'boolean',
      default: true,
    },
    showKeystrokes: {
      order: 4,
      title: 'Enable keystroke hints',
      description: 'Show info message with keystroke in lists',
      type: 'boolean',
      default: true,
    }
  },

  activate() {
    this.pathList = new PathList(this)
    this.pathData = new PathData(this)
    atom.packages.disablePackage('fuzzy-finder')
  },

  deactivate() {
    this.pathList.destroy()
    this.pathData.destroy()
  },

  consumeClassIcons(object) {
    this.getIconClass = object.iconClassForPath;
  },

  getProvider() {
    return new PathProv(this)
  },
}
