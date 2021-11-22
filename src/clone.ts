import { spawnSync } from "child_process";
import fs from 'fs';
import { v4 } from 'uuid';
import rimraf from 'rimraf';

import type { GitCloneSparseOptions } from './types';

export default function gitCloneSparse({
  owner,
  repo,
  appName,
  subDir,
}: GitCloneSparseOptions) {
  const tempDir = `${repo}_${v4()}`;
  const cwd = `${process.cwd()}/${tempDir}`;
  spawnSync('git', [
    'clone', '--depth 1',
    '--filter=blob:none',
    '--sparse', `https://github.com/${owner}/${repo}.git`,
    tempDir,
  ], { shell: true, stdio: 'inherit'});
  spawnSync('git', [
    'sparse-checkout',
    'set',
    subDir
  ], { shell: true, cwd, stdio: 'inherit' });
  fs.renameSync(`${tempDir}/${subDir}`, appName);
  rimraf.sync(tempDir);
}
