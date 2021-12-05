import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';

import GitCloneSparse from "./clone";
import GhDownload from "./download";
import type { DownloadGithubOptions } from './types';

export default function dgh(options: DownloadGithubOptions) {
  options.root = options.root || process.cwd();
  const appPath = path.join(options.root, options.name);

  if (options.root && !fs.existsSync(options.root)) {
    fs.mkdirSync(options.root, { recursive: true });
  }

  if (fs.existsSync(appPath)) {
    console.log(chalk.yellow`[dgh::warn]`, `${appPath} already exists.`);
    process.exit(1);
  }

  if (options.subdir) {
    return new GitCloneSparse(options).init();
  }

  return new GhDownload(options).init();
}
