import fs from 'fs';
import minimist from 'minimist';
import chalk from 'chalk';

import githubDownload from '.';

const argv = minimist(process.argv);

const { owner, repo, name, subdir, ref } = argv;

async function init() {
  if (fs.existsSync(name)) return console.log(chalk.yellow`[dgh::warn]`, `${name} already exists.`);
  if (argv['h'] || argv['help']) {
    console.log(`dgh usage:\n
  --owner    github username or organization
  --repo     github repository
  --name     app name
  --ref      github branch
  --subdir     repository subdirectory
    `);
    return;
  }

  githubDownload({
    owner,
    repo,
    name,
    ref,
    subdir,
  });
}

init()
  .catch((err) => {
    console.error(err);
  });