export type DownloadOptions = {
  name: string; // app name
  owner: string; // github username
  repo: string; // github repo
  dir: string; // github repo dir, support subdirectories, default `''`
  ref: string; // github branch, default `HEAD`
  token?: string; // github token
}

export type FileItem = {
  path: string;
  mode: string;
  type: string;
  sha: string;
  size: number;
  url: string;
}
