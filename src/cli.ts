import minimist from 'minimist';

import { DownloadGithub } from '.';

// new DownloadGithub({ owner: 'lencx', repo: 'rsw-node', ref: 'main' }).start()
// new DownloadGithub({ owner: 'lencx', repo: 'rsw-node', dir: 'test', ref: 'main', token: '' }).start()
new DownloadGithub({ owner: 'lencx', repo: 'z', dir: '', ref: 'main', token: '', name: 'test-download' }).start()
// new DownloadGithub({ owner: 'lencx', repo: 'sky', dir: '', ref: 'master', token: '' }).start()
  .on('warn', (msg) => {
    console.log('warn ~> ', msg);
  })
  .on('info', (type, msg, progress) => {
    console.log(`${progress} ~>`, type, msg, );
  })
  // .getRepo({ dir: 'test', fullData: true })
  // .getTree({ dir: 'test', fullData: true })
  // .then(res => console.log(res));
