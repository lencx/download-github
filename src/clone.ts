import fs from 'fs';
import rimraf from 'rimraf';
import request from 'request';
import { spawnSync } from "child_process";

import { tempDir } from './utils';
import type { GithubDownloadOptions } from './types';

export default function gitCloneSparse({
  owner,
  repo,
  appName,
  subDir,
  ref = 'HEAD',
}: GithubDownloadOptions) {
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${subDir}?ref=${ref}`;

  request({ url }, (err, resp) => {
    if (err) return console.error(err);

    if (resp.statusCode === 403) {
      const { repoPath, repoName } = tempDir(repo, false);

      spawnSync('git', [
        'clone', '--depth 1',
        '--filter=blob:none',
        '--sparse', `https://github.com/${owner}/${repo}.git`,
        repoName,
      ], { shell: true, stdio: 'inherit'});

      // TODO: checkout branch
      // spawnSync('git', [
      //   'checkout',
      //   ref,
      // ], { shell: true, cwd: repoPath, stdio: 'inherit' });

      spawnSync('git', [
        'sparse-checkout',
        'set',
        subDir
      ], { shell: true, cwd: repoPath, stdio: 'inherit' });

      fs.renameSync(`${repoName}/${subDir}`, appName);
      rimraf.sync(repoName);

      return;
    }

    if (resp.statusCode !== 200) console.log(new Error(`${url}: returned ${resp.statusCode}`));
  });
}
