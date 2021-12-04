import gitCloneSparse from "./clone";
import ghDownload from "./download";
import type { DownloadGithubOptions } from './types';

export default function dgh(options: DownloadGithubOptions) {
  if (options.subdir) {
    gitCloneSparse(options);
  } else {
    ghDownload(options);
  }
}