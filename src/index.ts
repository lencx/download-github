import gitCloneSparse from "./clone";
import ghDownload from "./download";

import type { GithubDownloadOptions } from './types';

export default function githubDownload(options: GithubDownloadOptions) {
  if (options.subDir) {
    gitCloneSparse(options);
  } else {
    ghDownload(options)
      .on('info', (type, msg) => {
        console.log('info ~> ', type, msg);
      })
      .on('error', (msg) => {
        console.log('info ~> ', msg);
      });
  }
}