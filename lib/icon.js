const fs = require("fs");
const path = require("path");

// LRU Cache for icon lookups to avoid repeated filesystem calls
class LRUCache {
  constructor(maxSize = 1000) {
    this.cache = new Map();
    this.maxSize = maxSize;
  }

  get(key) {
    if (!this.cache.has(key)) return undefined;
    // Move to end (most recently used)
    const value = this.cache.get(key);
    this.cache.delete(key);
    this.cache.set(key, value);
    return value;
  }

  set(key, value) {
    // Delete if exists to re-insert at end
    if (this.cache.has(key)) {
      this.cache.delete(key);
    }
    // Remove oldest if at capacity
    else if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    this.cache.set(key, value);
  }

  clear() {
    this.cache.clear();
  }
}

const iconCache = new LRUCache(1000);

function iconClassForPath(filePath) {
  // Check cache first
  const cached = iconCache.get(filePath);
  if (cached) return cached;

  const extension = path.extname(filePath);
  let result;

  try {
    // lstatSync throws if file doesn't exist - no need for separate existsSync
    const lstat = fs.lstatSync(filePath);
    if (lstat.isDirectory()) {
      if (lstat.isSymbolicLink()) {
        result = ["icon-file-symlink-directory"];
      } else {
        result = ["icon-file-directory"];
      }
    } else {
      if (lstat.isSymbolicLink()) {
        result = ["icon-file-symlink-file"];
      } else if (isReadmePath(extension, filePath)) {
        result = ["icon-book"];
      } else if (isCompressedExtension(extension)) {
        result = ["icon-file-zip"];
      } else if (isImageExtension(extension)) {
        result = ["icon-file-media"];
      } else if (isPdfExtension(extension)) {
        result = ["icon-file-pdf"];
      } else if (isBinaryExtension(extension)) {
        result = ["icon-file-binary"];
      } else {
        result = ["icon-file-text"];
      }
    }
  } catch (error) {
    // On error (file doesn't exist, permission denied, etc.), default to text file icon
    result = ["icon-file-text"];
  }

  // Cache the result
  iconCache.set(filePath, result);
  return result;
}

// Export both the function and cache invalidation method
iconClassForPath.invalidate = function (filePath) {
  iconCache.cache.delete(filePath);
};

iconClassForPath.invalidateAll = function () {
  iconCache.clear();
};

module.exports = iconClassForPath;

const MARKDOWN_EXTENSIONS = {
  ".markdown": true,
  ".md": true,
  ".mdown": true,
  ".mkd": true,
  ".mkdown": true,
  ".rmd": true,
  ".ron": true,
};

const COMPRESSED_EXTENSIONS = {
  ".bz2": true,
  ".egg": true,
  ".epub": true,
  ".gem": true,
  ".gz": true,
  ".jar": true,
  ".lz": true,
  ".lzma": true,
  ".lzo": true,
  ".rar": true,
  ".tar": true,
  ".tgz": true,
  ".war": true,
  ".whl": true,
  ".xpi": true,
  ".xz": true,
  ".z": true,
  ".zip": true,
};

const IMAGE_EXTENSIONS = {
  ".gif": true,
  ".ico": true,
  ".jpeg": true,
  ".jpg": true,
  ".png": true,
  ".tif": true,
  ".tiff": true,
  ".webp": true,
};

const BINARY_EXTENSIONS = {
  ".ds_store": true,
  ".a": true,
  ".exe": true,
  ".o": true,
  ".pyc": true,
  ".pyo": true,
  ".so": true,
  ".woff": true,
};

function isReadmePath(ext, readmePath) {
  const base = path.basename(readmePath, ext).toLowerCase();
  return base === "readme" && (ext === "" || isMarkdownExtension(ext));
}

function isMarkdownExtension(ext) {
  if (ext == null) {
    return false;
  }
  return MARKDOWN_EXTENSIONS[ext.toLowerCase()] !== undefined;
}

function isCompressedExtension(ext) {
  if (ext == null) {
    return false;
  }
  return COMPRESSED_EXTENSIONS[ext.toLowerCase()] !== undefined;
}

function isImageExtension(ext) {
  if (ext == null) {
    return false;
  }
  return IMAGE_EXTENSIONS[ext.toLowerCase()] !== undefined;
}

function isPdfExtension(ext) {
  return ext?.toLowerCase() === ".pdf";
}

function isBinaryExtension(ext) {
  if (ext == null) {
    return false;
  }
  return BINARY_EXTENSIONS[ext.toLowerCase()] !== undefined;
}
