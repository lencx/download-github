import path from 'path';
import { v4 } from 'uuid';

type TempDirReturn<T> =
  T extends true ? Record<'repoName' | 'repoPath', string> :
  T extends false ? string : never;
export function tempDir<T extends boolean = false>(repo: string, fullData?: T): TempDirReturn<T> {
  const repoName = `${repo}_${v4().replace(/-/ig, '')}`;
  const repoPath = path.join(process.cwd(), repoName);
  return (fullData ? { repoName, repoPath } : repoPath) as TempDirReturn<T>;
}
