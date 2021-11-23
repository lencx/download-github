
export type GithubDownloadOptions = {
  owner: string;
  repo: string;
  appName: string;
  ref?: string;
  subDir?: string;
  overwrite?: (file: string) => void;
}

export type DownloadOptions = Omit<GithubDownloadOptions, 'subDir'>;

export type TempDirReturn<T> =
  T extends true ? string :
  T extends false ? Record<'repoName' | 'repoPath', string> : never;
