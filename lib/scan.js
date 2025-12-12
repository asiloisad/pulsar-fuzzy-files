const { globSync } = require("glob");

module.exports = function (projectPath, ignores) {
  const entries = globSync("**", {
    cwd: projectPath,
    silent: true,
    nosort: true,
    dot: true,
    ignore: ignores,
    nodir: false,
    absolute: false,
  });
  emit("entries", {
    projectPath: projectPath,
    entries: entries,
  });
};
