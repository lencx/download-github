import path from 'path';
import fs from 'fs-extra';
import chalk from 'chalk';
import rimraf from 'rimraf';
import request from 'request';
import { EventEmitter } from 'events';
import { spawnSync } from "child_process";

import { tempDir, getFiles } from './utils';
import type { DownloadGithubOptions, ReopInfo } from './types';

export default class GitCloneSparse extends EventEmitter {
  public owner: string;
  public repo: string;
  public ref: string;
  public name: string;
  public root: string;
  public subdir: string;
  public overwrite: boolean;
  private url: string;
  private gitURI: string;

  constructor({ owner, repo, name, subdir, ref = 'HEAD', overwrite = true, root }: DownloadGithubOptions) {
    super();
    this.owner = owner;
    this.repo = repo;
    this.name = name;
    this.subdir = subdir;
    this.ref = ref;
    this.root = root;
    this.overwrite = overwrite;
    this.url = `https://api.github.com/repos/${owner}/${repo}/contents/${subdir}?ref=${ref}`;
    this.gitURI = `https://github.com/${owner}/${repo}.git`;
  }

  init() {
    this.emit('info', chalk.gray`[dgh:info] query-url` + chalk.yellow(this.url));
    this.requestJSON();
    return this;
  }

  requestJSON() {
    request({ url: this.url }, async (err, resp) => {
      if (err) return console.log(chalk.red(err));
      if (resp.statusCode === 403) {
        const repoInfo = tempDir(this.repo, true);

        if (this.ref === 'HEAD') {
          this.sparseDir(repoInfo);
        } else {
          this.singleBranch(repoInfo);
        }

        const newPath = path.join(this.root, this.name);
        fs.renameSync(`${repoInfo.repoName}/${this.subdir}`, newPath);
        rimraf.sync(repoInfo.repoName);
        console.log(chalk.gray`[dgh::clone]`, chalk.blue`${this.owner}/${this.repo}:${this.ref}/${this.subdir}`, chalk.green`${newPath}`);

        // overwrite file
        if (this.overwrite) {
          const files = await getFiles(newPath);
          this.emit('overwrite', files, fs);
        }

        this.emit('end');

        return;
      }

      if (resp.statusCode !== 200) return console.log(chalk.red`${this.url}: returned ${resp.statusCode}`);
    });
  }

  sparseDir({ repoName, repoPath }: ReopInfo) {
    const _arg1 = [
      'clone', '--depth 1',
      '--filter=blob:none',
      '--sparse', this.gitURI,
      repoName,
    ];
    const _arg2 = [
      'sparse-checkout set',
      this.subdir,
    ];

    this.emit('info', chalk.gray`[dgh:info] ` + chalk.red`git-sparse`);
    this.emit('info', chalk.gray`[dgh:info] ` + chalk.yellow`git ${_arg1.join(' ')}`);
    spawnSync('git', _arg1, { shell: true, stdio: 'inherit'});
    this.emit('info', chalk.gray`[dgh:info] ` + chalk.yellow`git ${_arg2.join(' ')}`);
    spawnSync('git', _arg2, { shell: true, cwd: repoPath, stdio: 'inherit' });
  }

  singleBranch({ repoName }: ReopInfo) {
    const _arg1 = [
      `clone --branch ${this.ref}`,
      `--single-branch ${this.gitURI}`,
      repoName,
    ];

    this.emit('info', chalk.gray`[dgh:info] ` + chalk.red`git-single-branch`);
    this.emit('info', chalk.gray`[dgh:info] ` + chalk.yellow`git ${_arg1.join(' ')}`);
    spawnSync('git', _arg1, { shell: true, stdio: 'inherit' });
  }
}
