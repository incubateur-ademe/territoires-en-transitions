import { rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  copyDataFolders,
  createTemporaryDirectory,
  removeSourceFromManifest,
  removeSourcesFromManifest,
} from '../../testing/data-folders.ts'
import { readAgriculturalAreaSources } from './read-agricultural-area-sources.ts'

const committedDataDirectory = join(import.meta.dirname, '..', '..', '..', 'data')
const folder = 'surface-agricole-utile'
const dataset = 'surface-agricole-utile/communes'

function copyDataDirectory(): string {
  return copyDataFolders({ from: committedDataDirectory, folders: [folder, 'territoires'] })
}

const SOURCE_READING_TIMEOUT_MS = 30_000

describe('readAgriculturalAreaSources', { timeout: SOURCE_READING_TIMEOUT_MS }, () => {
  it('lit les trois sources versionnées et la géographie', () => {
    const sources = readAgriculturalAreaSources(committedDataDirectory)._unsafeUnwrap()
    expect({
      communeCsvStartsWith: sources.communeCsv.slice(0, 11),
      regionCsvStartsWith: sources.regionCsv.slice(0, 11),
      departementCsvStartsWith: sources.departementCsv.slice(0, 11),
      communes: sources.communes.length,
    }).toEqual({
      communeCsvStartsWith: 'date_mesure',
      regionCsvStartsWith: 'date_mesure',
      departementCsvStartsWith: 'date_mesure',
      communes: 34_969,
    })
  })

  it.each([
    'sources/sau-commune.csv',
    'sources/sau-region.csv',
    'sources/sau-departement.csv',
  ])('refuse la source %s modifiée depuis son relevé', (file) => {
    const directory = copyDataDirectory()
    writeFileSync(join(directory, folder, file), 'autre')
    expect(readAgriculturalAreaSources(directory)._unsafeUnwrapErr()).toMatchObject({
      kind: 'invalid_dataset',
      dataset,
      reason: 'checksum_mismatch',
      detail: expect.stringContaining(`${file}: expected `) as string,
    })
  })

  it('refuse une source absente du disque', () => {
    const directory = copyDataDirectory()
    rmSync(join(directory, folder, 'sources', 'sau-region.csv'))
    expect(readAgriculturalAreaSources(directory)._unsafeUnwrapErr()).toMatchObject({
      dataset,
      reason: 'unreadable',
    })
  })

  it('refuse une source que le manifeste ne déclare pas', () => {
    const directory = copyDataDirectory()
    removeSourceFromManifest({ directory, folder, file: 'sources/sau-departement.csv' })
    expect(readAgriculturalAreaSources(directory)._unsafeUnwrapErr()).toEqual({
      kind: 'invalid_dataset',
      dataset,
      reason: 'invalid_manifest',
      detail: 'sources/sau-departement.csv',
    })
  })

  it('refuse un manifeste sans aucun champ sources', () => {
    const directory = copyDataDirectory()
    removeSourcesFromManifest({ directory, folder })
    expect(readAgriculturalAreaSources(directory)._unsafeUnwrapErr()).toMatchObject({
      dataset,
      reason: 'invalid_manifest',
      detail: 'sources/sau-commune.csv',
    })
  })

  it('refuse un dossier de données sans la géographie', () => {
    const directory = copyDataFolders({ from: committedDataDirectory, folders: [folder] })
    expect(readAgriculturalAreaSources(directory)._unsafeUnwrapErr()).toMatchObject({
      dataset: 'territoires/communes',
      reason: 'unknown_dataset',
    })
  })

  it('refuse un dossier de données sans le jeu de SAU', () => {
    expect(readAgriculturalAreaSources(createTemporaryDirectory())._unsafeUnwrapErr()).toMatchObject({
      dataset,
      reason: 'unknown_dataset',
    })
  })
})
