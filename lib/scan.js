const { globSync } = require('glob')

module.exports = function(pPath, ignores) {
  let entries = globSync('**', {
    cwd:pPath, silent:true, nosort:true, dot:true, ignore:ignores })
  emit('entries', { pPath:pPath, entries:entries })
}
