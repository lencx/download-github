export type DownloadGithubOptions = {
  // github username or org
  owner: string;
  // github repo
  repo: string;
  // app name
  name: string;
  // github branch
  ref?: string;
  // repository subdirectory, default 'HEAD'
  subdir?: string;
  // rewrite file content, default `true`
  overwrite?: boolean;
  // app path, default `./`
  root?: string;
}

export type DownloadOptions = Omit<DownloadGithubOptions, 'subdir'>;

export type ReopInfo = Record<'repoName' | 'repoPath', string>;
