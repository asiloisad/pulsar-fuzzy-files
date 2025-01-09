const PathList = require('./list')
const PathData = require('./data')
const PathProv = require('./prov')
let iconClassForPath = require('./icon')

module.exports = {

  config: {
    ignoredNames: {
      order: 1,
      title: 'List of ignore glob patterns',
      description: 'Files and directories matching these patterns will be ignored. This list is merged with the list defined by the core `Ignored Names` config setting',
      type: 'array',
      items: {
        type: 'string',
      },
      default: [],
    },
    insertSep: {
      order: 2,
      title: 'Type of separator in file paths',
      description: 'Type of separator for the file path when copying or pasting',
      type: 'integer',
      default: 0,
      enum: [
        { value: 0, description: 'Default' },
        { value: 1, description: 'Forward Slash' },
        { value: 2, description: 'Backslash' },
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

  iconClassForPath(filePath) {
    return iconClassForPath(filePath)
  },

  consumeClassIcons(object) {
    iconClassForPath = object.iconClassForPath
  },

  getProvider() {
    return new PathProv(this)
  },
}
