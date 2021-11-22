import fs from 'fs';
import rimraf from 'rimraf';
import { spawnSync } from "child_process";

import { tempDir } from './utils';
import type { GitCloneSparseOptions } from './types';

export default function gitCloneSparse({
  owner,
  repo,
  appName,
  subDir,
}: GitCloneSparseOptions) {
  // TODO: check repo
  const { repoPath, repoName } = tempDir(repo, true);
  spawnSync('git', [
    'clone', '--depth 1',
    '--filter=blob:none',
    '--sparse', `https://github.com/${owner}/${repo}.git`,
    repoName,
  ], { shell: true, stdio: 'inherit'});
  spawnSync('git', [
    'sparse-checkout',
    'set',
    subDir
  ], { shell: true, cwd: repoPath, stdio: 'inherit' });
  fs.renameSync(`${tempDir}/${subDir}`, appName);
  rimraf.sync(repoName);
}
