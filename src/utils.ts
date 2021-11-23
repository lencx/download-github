import path from 'path';
import { v4 } from 'uuid';

import { TempDirReturn } from './types';

export function tempDir<T extends boolean = true>(repo: string, isPath?: T): TempDirReturn<T> {
  const repoName = `${repo}_${v4().replace(/-/ig, '')}`;
  const repoPath = path.join(process.cwd(), repoName);
  return (isPath ? repoPath : { repoName, repoPath }) as TempDirReturn<T>;
};
