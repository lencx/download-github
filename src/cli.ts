import minimist from 'minimist';

import githubDownload from '.';

const argv = minimist(process.argv);

const { owner, repo, name, sub } = argv;

async function init() {
  githubDownload({
    owner,
    repo,
    appName: name,
    subDir: sub,
  });
}

init()
  .catch((err) => {
    console.error(err);
  });