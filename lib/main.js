const PathList = require('./list')
const PathData = require('./data')
const PathProv = require('./prov')
let iconClassForPath = require('./icon')

module.exports = {

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
