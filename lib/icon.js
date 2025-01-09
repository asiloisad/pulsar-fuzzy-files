const fs = require('fs')
const path = require('path')

function iconClassForPath(filePath) {
  const extension = path.extname(filePath)
  const lstat = fs.lstatSync(filePath)
  if (lstat.isDirectory()) {
    if (lstat.isSymbolicLink()) {
      return ['icon-file-symlink-directory']
    } else {
      return ['icon-file-directory']
    }
  } else {
    if (lstat.isSymbolicLink()) {
      return ['icon-file-symlink-file']
    } else if (isReadmePath(extension, filePath)) {
      return ['icon-book']
    } else if (isCompressedExtension(extension)) {
      return ['icon-file-zip']
    } else if (isImageExtension(extension)) {
      return ['icon-file-media']
    } else if (isPdfExtension(extension)) {
      return ['icon-file-pdf']
    } else if (isBinaryExtension(extension)) {
      return ['icon-file-binary']
    } else {
      return ['icon-file-text']
    }
  }
}

module.exports = iconClassForPath;

const MARKDOWN_EXTENSIONS = {
  '.markdown': true,
  '.md':       true,
  '.mdown':    true,
  '.mkd':      true,
  '.mkdown':   true,
  '.rmd':      true,
  '.ron':      true,
}

const COMPRESSED_EXTENSIONS = {
  '.bz2':  true,
  '.egg':  true,
  '.epub': true,
  '.gem':  true,
  '.gz':   true,
  '.jar':  true,
  '.lz':   true,
  '.lzma': true,
  '.lzo':  true,
  '.rar':  true,
  '.tar':  true,
  '.tgz':  true,
  '.war':  true,
  '.whl':  true,
  '.xpi':  true,
  '.xz':   true,
  '.z':    true,
  '.zip':  true
}

const IMAGE_EXTENSIONS = {
  '.gif':  true,
  '.ico':  true,
  '.jpeg': true,
  '.jpg':  true,
  '.png':  true,
  '.tif':  true,
  '.tiff': true,
  '.webp': true
}

const BINARY_EXTENSIONS = {
  '.ds_store': true,
  '.a':        true,
  '.exe':      true,
  '.o':        true,
  '.pyc':      true,
  '.pyo':      true,
  '.so':       true,
  '.woff':     true
}

function isReadmePath(ext, readmePath) {
  const base = path.basename(readmePath, ext).toLowerCase()
  return (base === 'readme') && ((ext === '') || isMarkdownExtension(ext))
}

function isMarkdownExtension(ext) {
  if (ext == null) { return false; }
  return MARKDOWN_EXTENSIONS.hasOwnProperty(ext.toLowerCase())
}

function isCompressedExtension(ext) {
  if (ext == null) { return false; }
  return COMPRESSED_EXTENSIONS.hasOwnProperty(ext.toLowerCase())
}

function isImageExtension(ext) {
  if (ext == null) { return false; }
  return IMAGE_EXTENSIONS.hasOwnProperty(ext.toLowerCase())
}

function isPdfExtension(ext) {
  return ext?.toLowerCase() === '.pdf';
}

function isBinaryExtension(ext) {
  if (ext == null) { return false; }
  return BINARY_EXTENSIONS.hasOwnProperty(ext.toLowerCase())
}
