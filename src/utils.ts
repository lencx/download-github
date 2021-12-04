import fs from 'fs';
import path from 'path';
import { v4 } from 'uuid';
import { promisify } from 'util';

const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);

type TempDirReturn<T> =
  T extends true ? Record<'repoName' | 'repoPath', string> :
  T extends false ? string : never;
export function tempDir<T extends boolean = false>(repo: string, fullData?: T): TempDirReturn<T> {
  const repoName = `${repo}_${v4().replace(/-/ig, '')}`;
  const repoPath = path.join(process.cwd(), repoName);
  return (fullData ? { repoName, repoPath } : repoPath) as TempDirReturn<T>;
}

export async function getFiles(dir: string) {
  const subdirs = await readdir(dir);
  const files = await Promise.all(subdirs.map(async (subdir) => {
    const res = path.resolve(dir, subdir);
    return (await stat(res)).isDirectory() ? getFiles(res) : res;
  }));
  return files.reduce((a: File[], f: File) => a.concat(f), []);
}
