import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { LEVERS } from '../../domain/lever-registry.ts'

const leversDirectory = join(import.meta.dirname, '..', '..', 'levers')

function folderOf(lever: string): string {
  return lever.replaceAll('_', '-')
}

function readMethodologies(): Readonly<Record<string, string>> {
  const entries = Object.keys(LEVERS).map((lever): [string, string] => [
    lever,
    readFileSync(join(leversDirectory, folderOf(lever), 'methodology.md'), 'utf8'),
  ])
  return Object.fromEntries(entries)
}

export { readMethodologies }
