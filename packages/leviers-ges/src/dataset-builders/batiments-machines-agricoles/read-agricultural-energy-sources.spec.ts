import { createHash } from 'node:crypto'
import { rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  copyDataFolders,
  createTemporaryDirectory,
  removeSourceFromManifest,
  removeSourcesFromManifest,
  setSourceChecksum,
} from '../../testing/data-folders.ts'
import { readAgriculturalEnergySources } from './read-agricultural-energy-sources.ts'

const committedDataDirectory = join(import.meta.dirname, '..', '..', '..', 'data')
const folder = 'batiments-machines-agricoles'
const regionWorkbook = 'sources/sdes-energie-region-84.xlsx'
const irisElectricityCsv = 'sources/sdes-electricite-iris-2024-agriculture.csv'

function copyDataDirectory(): string {
  return copyDataFolders({ from: committedDataDirectory, folders: [folder, 'territoires'] })
}

const WORKBOOK_READING_TIMEOUT_MS = 30_000

describe('readAgriculturalEnergySources', { timeout: WORKBOOK_READING_TIMEOUT_MS }, () => {
  it('lit les 13 classeurs régionaux, le classeur métropolitain, les quatre extraits locaux et la géographie', async () => {
    const sources = (await readAgriculturalEnergySources(committedDataDirectory))._unsafeUnwrap()
    expect({
      regionalSheets: sources.regionalSheets.length,
      nationalSheet: sources.nationalSheet.name,
      communes: sources.communes.length,
      irisElectricityStartsWith: sources.irisElectricityCsv.slice(0, 8),
      epciGasStartsWith: sources.epciGasCsv.slice(0, 8),
    }).toEqual({
      regionalSheets: 13,
      nationalSheet: 'sources/sdes-energie-france-metropolitaine.xlsx',
      communes: 34_969,
      irisElectricityStartsWith: 'OPERATEU',
      epciGasStartsWith: 'OPERATEU',
    })
  })

  it('lit les nombres du classeur comme du texte exact, sans flottant', async () => {
    const sources = (await readAgriculturalEnergySources(committedDataDirectory))._unsafeUnwrap()
    const brittany = sources.regionalSheets.find(({ rows }) => rows[0]?.[0] === '53')
    const petroleumLine = brittany?.rows.find((row) => row[0] === 'CA2')
    expect(petroleumLine?.[13]).toBe('6649.7118392209604')
  })

  it.each([
    ['un classeur régional', regionWorkbook],
    ['un extrait local', irisElectricityCsv],
  ])('refuse %s modifié depuis son relevé', async (_label, file) => {
    const directory = copyDataDirectory()
    writeFileSync(join(directory, folder, file), 'autre')
    expect((await readAgriculturalEnergySources(directory))._unsafeUnwrapErr()).toMatchObject({
      kind: 'invalid_dataset',
      reason: 'checksum_mismatch',
      detail: expect.stringContaining(`${file}: expected `) as string,
    })
  })

  it('refuse un classeur absent du disque', async () => {
    const directory = copyDataDirectory()
    rmSync(join(directory, folder, regionWorkbook))
    expect((await readAgriculturalEnergySources(directory))._unsafeUnwrapErr()).toMatchObject({
      reason: 'unreadable',
      detail: expect.stringContaining(regionWorkbook) as string,
    })
  })

  it('refuse un fichier qui n’est pas un classeur, même avec la bonne empreinte', async () => {
    const directory = copyDataDirectory()
    const content = 'ce n’est pas un classeur'
    writeFileSync(join(directory, folder, regionWorkbook), content)
    setSourceChecksum({
      directory,
      folder,
      file: regionWorkbook,
      checksum: createHash('sha256').update(content).digest('hex'),
    })
    expect((await readAgriculturalEnergySources(directory))._unsafeUnwrapErr()).toMatchObject({
      dataset: 'batiments-machines-agricoles/regions.csv',
      reason: 'unreadable',
      detail: expect.stringContaining(`${regionWorkbook}: `) as string,
    })
  })

  it('refuse un manifeste qui ne déclare plus le classeur métropolitain', async () => {
    const directory = copyDataDirectory()
    removeSourcesFromManifest({ directory, folder })
    expect((await readAgriculturalEnergySources(directory))._unsafeUnwrapErr()).toEqual({
      kind: 'invalid_dataset',
      dataset: 'batiments-machines-agricoles/regions.csv',
      reason: 'invalid_manifest',
      detail: 'sources/sdes-energie-france-metropolitaine.xlsx',
    })
  })

  it('refuse un manifeste qui ne déclare plus un extrait local', async () => {
    const directory = copyDataDirectory()
    removeSourceFromManifest({ directory, folder, file: irisElectricityCsv })
    expect((await readAgriculturalEnergySources(directory))._unsafeUnwrapErr()).toEqual({
      kind: 'invalid_dataset',
      dataset: 'batiments-machines-agricoles/departements.csv',
      reason: 'invalid_manifest',
      detail: irisElectricityCsv,
    })
  })

  it('refuse un dossier de données sans la géographie', async () => {
    const directory = copyDataFolders({ from: committedDataDirectory, folders: [folder] })
    expect((await readAgriculturalEnergySources(directory))._unsafeUnwrapErr()).toMatchObject({
      dataset: 'territoires/communes',
      reason: 'unknown_dataset',
    })
  })

  it('refuse un dossier de données sans les jeux d’énergie agricole', async () => {
    expect(
      (await readAgriculturalEnergySources(createTemporaryDirectory()))._unsafeUnwrapErr(),
    ).toMatchObject({
      dataset: 'batiments-machines-agricoles/regions.csv',
      reason: 'unknown_dataset',
    })
  })
})
