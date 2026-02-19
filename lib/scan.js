const { globSync } = require("glob");

process.on("message", ({ projectPath, ignores }) => {
  const entries = globSync("**", {
    cwd: projectPath,
    silent: true,
    nosort: true,
    dot: true,
    ignore: ignores,
    nodir: false,
    absolute: false,
  });
  process.send({ entries });
  process.exit();
});
