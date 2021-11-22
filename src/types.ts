
export type GithubDownloadOptions = {
  owner: string;
  repo: string;
  appName: string;
  ref?: string;
  subDir?: string;
  overwrite?: (file: string) => void;
}

export type DownloadOptions = Omit<GithubDownloadOptions, 'subDir'>;
