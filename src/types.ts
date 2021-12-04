export type DownloadGithubOptions = {
  owner: string;
  repo: string;
  name: string;
  ref?: string;
  subdir?: string;
  overwrite?: (file: string) => void;
}

export type DownloadOptions = Omit<DownloadGithubOptions, 'subDir'>;
