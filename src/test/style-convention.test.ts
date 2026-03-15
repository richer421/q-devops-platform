import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

function collectTsxFiles(dir: string): string[] {
  const entries = readdirSync(dir);
  const files: string[] = [];

  for (const entry of entries) {
    const fullPath = join(dir, entry);
    const stats = statSync(fullPath);

    if (stats.isDirectory()) {
      files.push(...collectTsxFiles(fullPath));
      continue;
    }

    if (fullPath.endsWith('.tsx')) {
      files.push(fullPath);
    }
  }

  return files;
}

describe('style convention', () => {
  it('does not use className props in TSX files', () => {
    const root = join(process.cwd(), 'src');
    const tsxFiles = collectTsxFiles(root);
    const offenders: string[] = [];

    for (const file of tsxFiles) {
      const content = readFileSync(file, 'utf8');
      if (content.includes('className=')) {
        offenders.push(file.replace(`${process.cwd()}/`, ''));
      }
    }

    expect(offenders).toEqual([]);
  });
});
