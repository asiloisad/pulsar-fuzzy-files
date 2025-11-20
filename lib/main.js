let iconClassForPath = null

module.exports = {

  activate() {
    const PathList = require('./list')
    const PathData = require('./data')
    this.pathList = new PathList(this)
    this.pathData = new PathData(this)
    atom.packages.disablePackage('fuzzy-finder')
  },

  deactivate() {
    this.pathList.destroy()
    this.pathData.destroy()
  },

  iconClassForPath(filePath) {
    if (!iconClassForPath) {
      iconClassForPath = require('./icon')
    }
    return iconClassForPath(filePath)
  },

  consumeClassIcons(object) {
    iconClassForPath = object.iconClassForPath
  },

  getProvider() {
    const PathProv = require('./prov')
    return new PathProv(this)
  },
}
