import path from 'path';
import { v4 } from 'uuid';

export function tempDir(repo: string): string;
export function tempDir(repo: string, isPath: boolean): Record<'repoName' | 'repoPath', string>;
export function tempDir(repo: string, isPath = true) {
  const repoName = `${repo}_${v4().replace('-', '')}`;
  const repoPath = path.join(process.cwd(), repoName);
  return isPath ? repoPath : { repoName, repoPath };
};
