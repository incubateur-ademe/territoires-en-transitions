import { createHash } from 'node:crypto'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll } from 'vitest'
import type { DataRow, DataSource } from '../domain/data-source.ts'
import type { Level } from '../domain/territory.ts'
import { createCsvDataSource } from '../infrastructure/csv/csv-data-source.ts'

type DatasetFixture = {
  readonly keyColumn: string
  readonly level?: Level
  readonly rows: readonly DataRow[]
}

type DatasetFixtures = Readonly<Record<string, DatasetFixture>>

const UNQUOTED_CELL = /^[^",\r\n]*$/

function toCsv(rows: readonly DataRow[]): string {
  const [first] = rows
  if (first === undefined) throw new Error('a fixture dataset needs at least one row')
  const columns = Object.keys(first)
  const cells = rows.flatMap((row) => columns.map((column) => row[column] ?? ''))
  const quotedCell = cells.find((cell) => !UNQUOTED_CELL.test(cell))
  if (quotedCell !== undefined) throw new Error(`cell ${quotedCell} needs CSV quoting`)
  const lines = rows.map((row) => columns.map((column) => row[column]).join(','))
  return `${[columns.join(','), ...lines].join('\n')}\n`
}

function toManifestEntry({
  file,
  fixture,
  csv,
}: {
  file: string
  fixture: DatasetFixture
  csv: string
}): Record<string, unknown> {
  const [first] = fixture.rows
  return {
    file,
    source: 'Jeu de test',
    link: 'https://example.org',
    vintage: '2024',
    retrievedOn: '2026-10-08',
    checksum: createHash('sha256').update(csv).digest('hex'),
    level: fixture.level,
    keyColumn: fixture.keyColumn,
    columns: Object.keys(first ?? {}).map((name) => ({ name, unit: 'texte' })),
  }
}

function writeDatasets(root: string, fixtures: DatasetFixtures): void {
  const entries = Object.entries(fixtures).map(([name, fixture]) => {
    const [folder = '', file = ''] = name.split('/')
    return { folder, file: `${file}.csv`, fixture, csv: toCsv(fixture.rows) }
  })
  const folders = new Set(entries.map(({ folder }) => folder))
  folders.forEach((folder) => {
    const inFolder = entries.filter((entry) => entry.folder === folder)
    mkdirSync(join(root, folder))
    inFolder.forEach(({ file, csv }) => {
      writeFileSync(join(root, folder, file), csv)
    })
    const manifest = { datasets: inFolder.map((entry) => toManifestEntry(entry)) }
    writeFileSync(join(root, folder, 'manifest.json'), JSON.stringify(manifest))
  })
}

function createTemporaryCsvDataSource(fixtures: DatasetFixtures): DataSource {
  const root = mkdtempSync(join(tmpdir(), 'leviers-ges-'))
  afterAll(() => {
    rmSync(root, { recursive: true, force: true })
  })
  writeDatasets(root, fixtures)
  return createCsvDataSource(root)
}

export { createTemporaryCsvDataSource }
export type { DatasetFixture }
