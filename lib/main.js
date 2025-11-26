let iconClassForPath = null;
let openExternalService = null;
let windowsClipService = null;

/**
 * Fuzzy Files Package
 * Provides fuzzy file searching and navigation capabilities.
 * Replaces the default fuzzy-finder with enhanced features.
 */
module.exports = {
  /**
   * Activates the package and initializes path list and data components.
   */
  activate() {
    const PathList = require("./list");
    const PathData = require("./data");
    this.pathList = new PathList(this);
    this.pathData = new PathData(this);
    atom.packages.disablePackage("fuzzy-finder");
  },

  /**
   * Deactivates the package and disposes resources.
   */
  deactivate() {
    this.pathList.destroy();
    this.pathData.destroy();
  },

  /**
   * Gets the icon class for a file path.
   * @param {string} filePath - The file path to get icon for
   * @returns {string} The CSS class for the file icon
   */
  iconClassForPath(filePath) {
    if (!iconClassForPath) {
      iconClassForPath = require("./icon");
    }
    return iconClassForPath(filePath);
  },

  /**
   * Consumes the file-icons service for icon display.
   * @param {Object} object - The file-icons service object
   */
  consumeClassIcons(object) {
    iconClassForPath = object.iconClassForPath;
  },

  /**
   * Consumes the open-external service for opening files externally.
   * @param {Object} service - The open-external service object
   * @returns {Object} Disposable to unregister the service
   */
  consumeOpenExternalService(service) {
    openExternalService = service;
    if (this.pathList) {
      this.pathList.setOpenExternalService(service);
    }
    return {
      dispose: () => {
        openExternalService = null;
      },
    };
  },

  /**
   * Gets the open-external service.
   * @returns {Object|null} The open-external service or null
   */
  getOpenExternalService() {
    return openExternalService;
  },

  /**
   * Consumes the windows-clip service for clipboard operations.
   * @param {Object} service - The windows-clip service object
   * @returns {Object} Disposable to unregister the service
   */
  consumeWindowsClip(service) {
    windowsClipService = service;
    if (this.pathList) {
      this.pathList.setWindowsClipService(service);
    }
    return {
      dispose: () => {
        windowsClipService = null;
      },
    };
  },

  /**
   * Gets the windows-clip service.
   * @returns {Object|null} The windows-clip service or null
   */
  getWindowsClipService() {
    return windowsClipService;
  },

  /**
   * Gets the autocomplete provider for path completion.
   * @returns {PathProv} The path autocomplete provider
   */
  getProvider() {
    const PathProv = require("./prov");
    return new PathProv(this);
  },
};
