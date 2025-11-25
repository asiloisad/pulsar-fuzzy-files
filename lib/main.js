let iconClassForPath = null
let openExternalService = null
let windowsClipService = null

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

  consumeOpenExternalService(service) {
    openExternalService = service
    if (this.pathList) {
      this.pathList.setOpenExternalService(service)
    }
    return { dispose: () => { openExternalService = null } }
  },

  getOpenExternalService() {
    return openExternalService
  },

  consumeWindowsClip(service) {
    windowsClipService = service
    if (this.pathList) {
      this.pathList.setWindowsClipService(service)
    }
    return { dispose: () => { windowsClipService = null } }
  },

  getWindowsClipService() {
    return windowsClipService
  },

  getProvider() {
    const PathProv = require('./prov')
    return new PathProv(this)
  },
}
