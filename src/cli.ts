import chalk from 'chalk';
import minimist from 'minimist';

import dgh from '.';

const argv = minimist(process.argv);

const { owner, repo, name, subdir, ref, root } = argv;

async function init() {
  if (argv['h'] || argv['help']) {
    console.log(`dgh usage:\n
  --owner      github username or organization
  --repo       github repository
  --name       app name
  [--root]     app path, default \`process.cwd()\`
  [--ref]      github branch, default \`HEAD\`
  [--subdir]   repository subdirectory\n`);
    return;
  }

  if (!owner || !repo || !name) {
    console.log(chalk.red('required: `owner`, `repo`, `name`'));
    process.exit(1);
  }

  dgh({ owner, repo, name, ref, subdir, root });
}

init()
  .catch((err) => {
    console.error(err);
  });