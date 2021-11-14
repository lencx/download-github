import https from 'https';
import fs from 'fs-extra';
import { URL } from 'url';
import { EventEmitter } from 'events';

import type { DownloadOptions, FileItem } from './types';

export class DownloadGithub extends EventEmitter {
  public name: string; // app name
  public owner: string; // github username
  public repo: string; // github repo
  public ref: string; // github branch
  public dir: string; // github sub dir
  public token: string; // github token
  private headers: Record<string, any>; // request headers
  private repoIsPrivate: boolean; // repo type
  private downloaded: number; // download progress
  private files: any[]; // download file list

  constructor({ name, owner, repo, ref, dir, token }: DownloadOptions) {
    super();
    this.name = name,
    this.owner = owner;
    this.repo = repo;
    this.ref = ref || 'HEAD';
    this.dir = dir || '';
    this.token = token;
    this.downloaded = 0;
    this.files = [];
    this.headers = {
      ...(this.token ? { 'Authorization': `Bearer ${this.token}` } : {}),
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:93.0) Gecko/20100101 Firefox/93.0',
    };
  }

  urlParse(uri: string) {
    const { protocol, hostname, pathname, search } = new URL(uri);
    return { protocol, hostname, path: pathname + search, headers: this.headers };
  }

  // Get repo data
  ghFetch(ghPath: string = '') {
    const baseURL = `https://api.github.com/repos/${this.owner}/${this.repo}${ghPath}`;

    return new Promise((resolve, reject) => {
      https.get(this.urlParse(baseURL), (res) => {
        switch (res.statusCode) {
          case 401:
            reject(new Error(`GET ${res.statusCode} / Invalid Token`));
          case 403:
            reject(new Error(`GET ${res.statusCode} / Rate Limit Exceeded`));
          case 404:
            reject(new Error(`GET ${res.statusCode} / Repository Not Found`));
          default:
        }

        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            const _data = JSON.parse(data);
            resolve(_data);
          } catch (err) {
            reject(err);
          }
        });
      });
    })
  }

  // Great for downloads with few sub directories on big repos
  // Cons: many requests if the repo has a lot of nested dirs
  async getRepo({ dir = this.dir, fullData = false }) {
    const res: any = await this.ghFetch(`/contents/${dir}?ref=${this.ref}`);

    if (res.message === 'Not Found') {
      return [];
    }
    if (res.message) {
      throw new Error(res.message);
    }

    const files = [];
    const requests = [];

    for (const item of res) {
      if (item.type === 'file') {
        files.push(fullData ? item : item.path);
      }
      if (item.type === 'dir') {
        requests.push(this.getRepo({
          dir: item.path,
          fullData,
        }));
      }
    }
    return files.concat(...await Promise.all(requests));
  }

  // Great for downloads with many sub directories
  // Pros: one request + maybe doesn't require token
  // Cons: huge on huge repos + may be truncated
  async getTree({ dir = this.dir, fullData = false }) {
    const files: Array<FileItem|string> = [];
    const res: any = await this.ghFetch(`/git/trees/${this.ref}?recursive=1`);

    if (res.message) {
      throw new Error(res.message);
    }

    for (const item of res.tree) {
      // type: blob | tree
      if (item.type === 'blob' && item.path.startsWith(dir)) {
        files.push(fullData ? item : item.path);
      }
    }

    // @ts-ignore
    files.truncated = res.truncated;

    return files;
  }

  // public repo
  async fetchPublicFile(file: FileItem) {
    https.get(this.urlParse(file.url), (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        const content = JSON.parse(data)?.content;
        const outFile = `${this.name}/${file.path}`;
        fs.outputFile(outFile, content, { encoding: 'base64' });
        this.downloaded += 1;
        this.emit('info', 'download', outFile, `${this.downloaded}/${this.files.length}`)
      });
    }).on('error', (e) => {
      console.error(e);
    });
  }

  // private repo
  async fetchPrivateFile(file: any) {
    if (!this.token) {
      throw new Error('Private repo token is required');
    }
  }

  // download repo
  async download(file: any) {
    this.repoIsPrivate
      ? await this.fetchPrivateFile(file)
      : await this.fetchPublicFile(file);
  }

  async init() {
    const { private: repoIsPrivate }: any = await this.ghFetch() || {};
    this.repoIsPrivate = repoIsPrivate;

    const files = await this.getTree({ fullData: true });

    if (files.length === 0) {
      this.emit('warn', 'No files to download');
      return;
    }
    this.files = files;
    await Promise.all(files.map((i) => this.download(i)));
  }

  start() {
    this.init();
    return this;
  }
}
