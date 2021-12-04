import fs from 'fs';
import chalk from 'chalk';
import rimraf from 'rimraf';
import request from 'request';
import { spawnSync } from "child_process";

import { tempDir, getFiles } from './utils';
import type { DownloadGithubOptions } from './types';

export default function gitCloneSparse({
  owner,
  repo,
  name,
  subdir,
  ref = 'HEAD',
  overwrite,
}: DownloadGithubOptions) {
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${subdir}?ref=${ref}`;

  request({ url }, async (err, resp) => {
    if (err) return console.log(chalk.red(err));

    if (resp.statusCode === 403) {
      const { repoPath, repoName } = tempDir(repo, true);

      if (ref === 'HEAD') {
        spawnSync('git', [
          'clone', '--depth 1',
          '--filter=blob:none',
          '--sparse', `https://github.com/${owner}/${repo}.git`,
          repoName,
        ], { shell: true, stdio: 'inherit'});
        spawnSync('git', [
          'sparse-checkout set',
          subdir,
        ], { shell: true, cwd: repoPath, stdio: 'inherit' });
      } else {
        spawnSync('git', [
          `clone --branch ${ref}`,
          `--single-branch https://github.com/${owner}/${repo}.git`,
          repoName,
        ], { shell: true, stdio: 'inherit'});
      }

      fs.renameSync(`${repoName}/${subdir}`, name);
      rimraf.sync(repoName);
      console.log(chalk.gray`[dgh::clone]`, chalk.green`${repo}:${ref}/${subdir} ~> ${name}`);

      if (overwrite) {
        const files = await getFiles(name);
        files.forEach(overwrite);
      }

      return;
    }

    if (resp.statusCode !== 200) return console.log(chalk.red`${url}: returned ${resp.statusCode}`);
  });
}
