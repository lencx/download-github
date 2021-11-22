import path from 'path';
import fs from 'fs-extra';
import chalk from 'chalk';
import request from 'request';
import AdmZip from 'adm-zip';
import { v4 } from 'uuid';
import { EventEmitter } from 'events';

import type { DownloadOptions } from './types';

const cwd = process.cwd();

export class GithubDownloader extends EventEmitter {
  public owner: string;
  public repo: string;
  public ref: string;
  public appName: string;
  public overwrite: (file: string) => void;
  private initURL: string;
  private initRef: string;
  private zipURL: string;

  constructor({ owner, repo, ref, appName, overwrite }: DownloadOptions) {
    super();
    this.owner = owner;
    this.repo = repo;
    this.ref = ref || 'HEAD';
    this.appName = appName;
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
      if (err) return this.emit('error', err);
      if (resp.statusCode === 403) return this.downloadZip();
      if (resp.statusCode !== 200) this.emit('error', new Error(`${url}: returned ${resp.statusCode}`));
    });
  }

  downloadZip() {
    const tmpdir = this.generateTempDir(this.repo);
    const zipBaseDir = `${this.repo}-${this.ref}`;
    const zipFile = path.join(tmpdir, `${zipBaseDir}.zip`);

    this.emit('info', 'url', this.zipURL);

    fs.mkdir(tmpdir, (err) => {
      if (err) this.emit('error', err)
      request.get(this.zipURL).pipe(
        fs.createWriteStream(zipFile)).on('close', () => {
          try {
            extractZip.call(this, this.appName, this.overwrite, zipFile, tmpdir, (extractedFolderName: string) => {
              const oldPath = path.join(tmpdir, extractedFolderName);

              fs.rename(oldPath, this.appName, (err) => {
                if (err) this.emit('error', err);

                fs.remove(tmpdir, (err) => {
                  if (err) this.emit('error', err);
                  this.emit('end', `${this.owner}/${this.repo}`);
                });
              });
            })
          } catch (e) {
            this.emit('error', fs.readFileSync(zipFile));
            console.log(chalk.red`\n[mpl::invalid]:`, chalk.blue`https://github.com/${this.owner}/${this.repo}/tree/${this.ref}\n`);
            fs.removeSync(tmpdir);
            process.exit(1);
          }
        }
      )
    })
  }

  generateTempDir(repo: string) {
    return path.join(cwd, `${repo}-${v4()}`);
  }
}

export default function ghDownload(options: DownloadOptions) {
  options.appName = options.appName || process.cwd();
  const ghdownload = new GithubDownloader(options)
  return ghdownload.start();
}

export function extractZip(
  appName: string,
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
    if (err) this.emit('error', err);

    if (file) {
      // nodejs
      if (/\/package.json$/.test(file)) {
        const data = fs.readJSONSync(file);
        data.name = appName;
        fs.writeJSONSync(file, data, { spaces: 2 });
      }
      // overwrite file
      if (overwrite) {
        overwrite(file);
      }
    }

    pending += 1;
    // this.emit('info', 'pending', `${pending}/${total}`);
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
