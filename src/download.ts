import path from 'path';
import fs from 'fs-extra';
import chalk from 'chalk';
import request from 'request';
import AdmZip from 'adm-zip';

import { tempDir } from './utils';
import type { DownloadOptions } from './types';

const cwd = process.cwd();

export class GithubDownloader {
  public owner: string;
  public repo: string;
  public ref: string;
  public name: string;
  public overwrite: (file: string) => void;
  private initURL: string;
  private initRef: string;
  private zipURL: string;

  constructor({ owner, repo, ref, name, overwrite }: DownloadOptions) {
    this.owner = owner;
    this.repo = repo;
    this.ref = ref || 'HEAD';
    this.name = name;
    this.overwrite = overwrite;
    this.initRef = this.ref ? `?ref=${this.ref}` : '';
    this.initURL = `https://api.github.com/repos/${this.owner}/${this.repo}/contents/`;
    this.zipURL = `https://nodeload.github.com/${this.owner}/${this.repo}/zip/${this.ref}`;
  }

  start() {
    this.requestJSON(this.initURL + this.initRef);
    return this;
  }

  requestJSON(url: string) {
    request({ url }, (err, resp) => {
      if (err) return console.log(chalk.red`[dgh::error]`, err);
      if (resp.statusCode === 403) return this.downloadZip();
      if (resp.statusCode !== 200) console.log(chalk.red`[dgh::error]`, `${url}: returned ${resp.statusCode}`);
    });
  }

  downloadZip() {
    const tmpdir = this.generateTempDir(this.repo);
    const zipBaseDir = `${this.repo}-${this.ref}`;
    const zipFile = path.join(tmpdir, `${zipBaseDir}.zip`);

    console.log(chalk.gray`[dgh::info]`, chalk.blue`download-url`, chalk.yellow(this.zipURL));

    fs.mkdir(tmpdir, (err) => {
      if (err) console.log(chalk.red`[dgh::error]`, err);
      request.get(this.zipURL).pipe(
        fs.createWriteStream(zipFile)).on('close', () => {
          try {
            extractZip.call(this, this.name, this.overwrite, zipFile, tmpdir, (extractedFolderName: string) => {
              const oldPath = path.join(tmpdir, extractedFolderName);

              fs.rename(oldPath, this.name, (err) => {
                if (err) console.log(chalk.red`[dgh::error]`, err);

                fs.remove(tmpdir, (err) => {
                  if (err) console.log(chalk.red`[dgh::error]`, err);
                  console.log(chalk.gray`[dgh::download]`, chalk.green`${this.owner}/${this.repo} ~> ${this.name}`);
                });
              });
            })
          } catch (e) {
            console.log(chalk.red`[dgh::error]:`, chalk.gray`invalid-url`, chalk.blue`https://github.com/${this.owner}/${this.repo}/tree/${this.ref}\n`);
            fs.removeSync(tmpdir);
            process.exit(1);
          }
        }
      )
    })
  }

  generateTempDir(repo: string) {
    const { repoName } = tempDir(repo, true);
    return path.join(cwd, repoName);
  }
}

export default function ghDownload(options: DownloadOptions) {
  options.name = options.name || process.cwd();
  const ghdownload = new GithubDownloader(options)
  return ghdownload.start();
}

export function extractZip(
  name: string,
  overwrite: Function,
  zipFile: string | Buffer,
  outputDir: string,
  callback: (dirName: string) => void,
) {
  const zip = new AdmZip(zipFile);
  const entries = zip.getEntries();

  let total = entries.length;
  let pending = 0;
  const folderName = path.basename(entries[0].entryName);

  const checkDone = (err?: Error, file?: string) => {
    if (err) console.log(chalk.red`[dgh::error]`, err);

    if (file) {
      // nodejs
      if (/\/package.json$/.test(file)) {
        const data = fs.readJSONSync(file);
        data.name = name;
        fs.writeJSONSync(file, data, { spaces: 2 });
      }
      // overwrite file
      if (overwrite) {
        overwrite(file);
      }
    }

    pending += 1;
    if (pending === total) {
      callback(folderName);
    }
  }

  entries.forEach((entry) => {
    if (entry.isDirectory) return checkDone();

    const file = path.resolve(outputDir, entry.entryName);
    fs.outputFile(file, entry.getData(), (err) => checkDone(err, file));
  })
}
