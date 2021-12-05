import path from 'path';
import fs from 'fs-extra';
import chalk from 'chalk';
import request from 'request';
import AdmZip from 'adm-zip';
import Spinnies from 'spinnies'
import { EventEmitter } from 'events';

import { tempDir, getFiles } from './utils';
import type { DownloadOptions } from './types';

const cwd = process.cwd();
const spinners = new Spinnies();

export default class GithubDownloader extends EventEmitter {
  public owner: string;
  public repo: string;
  public ref: string;
  public name: string;
  public root: string;
  public overwrite: boolean;
  private initURL: string;
  private initRef: string;
  private zipURL: string;

  constructor({ owner, repo, ref = 'HEAD', name, overwrite = true, root }: DownloadOptions) {
    super();
    this.owner = owner;
    this.repo = repo;
    this.name = name;
    this.ref = ref;
    this.root = root;
    this.overwrite = overwrite;
    this.initRef = this.ref ? `?ref=${this.ref}` : '';
    this.initURL = `https://api.github.com/repos/${this.owner}/${this.repo}/contents/`;
    this.zipURL = `https://nodeload.github.com/${this.owner}/${this.repo}/zip/${this.ref}`;
  }

  init() {
    const _url = this.initURL + this.initRef;
    this.emit('info', chalk.gray`[dgh:info] query-url` + chalk.yellow(_url));
    this.requestJSON(_url);
    return this;
  }

  requestJSON(url: string) {
    spinners.add('loading', { text: 'download...' });
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

    this.emit('info', chalk.gray`[dgh:info] download-url` + chalk.yellow(this.zipURL));

    fs.mkdir(tmpdir, (err) => {
      if (err) console.log(chalk.red`[dgh::error]`, err);
      request.get(this.zipURL).pipe(
        fs.createWriteStream(zipFile)).on('close', () => {
          try {
            extractZip.call(this, this.name, zipFile, tmpdir, (extractedFolderName: string) => {
              const oldPath = path.join(tmpdir, extractedFolderName);
              const newPath = path.join(this.root, this.name);

              fs.rename(oldPath, newPath, (err) => {
                if (err) console.log(chalk.red`[dgh::error]`, err);

                fs.remove(tmpdir, async (err) => {
                  if (err) console.log(chalk.red`[dgh::error]`, err);
                  const _ref = this.ref ? `:${this.ref}` : '';
                  console.log(chalk.gray`[dgh::download]`, chalk.blue`${this.owner}/${this.repo}${_ref}`, chalk.green`${newPath}`);

                  // overwrite file
                  if (this.overwrite) {
                    const files = await getFiles(newPath);
                    this.emit('overwrite', files, fs);
                  }

                  this.emit('end');

                  spinners.succeed('loading', { text: '🎉 Done' });
                });
              });
            })
          } catch (e) {
            fs.removeSync(tmpdir);
            spinners.fail('loading', { text: 'oops! something went wrong' });
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

export function extractZip(
  name: string,
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
