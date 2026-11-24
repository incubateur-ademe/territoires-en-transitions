import { createHash } from 'node:crypto'
import { rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  copyDataFolders,
  createTemporaryDirectory,
  removeSourceFromManifest,
  setSourceChecksum,
} from '../../testing/data-folders.ts'
import { readResidentialEnergySources } from './read-residential-energy-sources.ts'

const committedDataDirectory = join(import.meta.dirname, '..', '..', '..', 'data')
const folder = 'residentiel-sobriete'
const cerenWorkbook = 'sources/ceren-donnees-energie-residentiel-1990-2024.xlsx'
const irisElectricityCsv = 'sources/sdes-electricite-iris-2024-residentiel-par-departement.csv'
const heatCsv = 'sources/sdes-chaleur-commune-2024.csv'

function copyDataDirectory(): string {
  return copyDataFolders({ from: committedDataDirectory, folders: [folder] })
}

describe('readResidentialEnergySources', () => {
  it('lit les six sources versionnées dont les empreintes correspondent au manifeste', async () => {
    const sources = (await readResidentialEnergySources(committedDataDirectory))._unsafeUnwrap()
    expect({
      regionalBilanStartsWith: sources.regionalBilanCsv.slice(0, 7),
      cerenFirstCell: sources.cerenRows[0]?.[0],
      irisElectricityStartsWith: sources.irisElectricityCsv.slice(0, 16),
      irisGasStartsWith: sources.irisGasCsv.slice(0, 16),
      oilSalesStartsWith: sources.oilSalesCsv.slice(0, 18),
      heatStartsWith: sources.heatCsv.slice(0, 4),
    }).toEqual({
      regionalBilanStartsWith: 'fichier',
      cerenFirstCell: 'Données sur l’énergie dans le résidentiel en France Métropolitaine',
      irisElectricityStartsWith: 'code_departement',
      irisGasStartsWith: 'code_departement',
      oilSalesStartsWith: '"DEPARTEMENT_CODE"',
      heatStartsWith: '"ID"',
    })
  })

  it('lit les nombres du classeur CEREN comme du texte exact', async () => {
    const sources = (await readResidentialEnergySources(committedDataDirectory))._unsafeUnwrap()
    const fuelOilRow = sources.cerenRows.find((row) => row[0] === 'Total Fioul')
    expect(fuelOilRow?.[8]).toBe('32')
  })

  it.each([
    ['le bilan régional', 'sources/sdes-bilan-energie-residentiel-2024.csv'],
    ['un extrait local', irisElectricityCsv],
    ['le jeu des réseaux de chaleur', heatCsv],
    ['le classeur CEREN', cerenWorkbook],
  ])('refuse %s modifié depuis son relevé', async (_label, file) => {
    const directory = copyDataDirectory()
    writeFileSync(join(directory, folder, file), 'autre')
    expect((await readResidentialEnergySources(directory))._unsafeUnwrapErr()).toMatchObject({
      kind: 'invalid_dataset',
      reason: 'checksum_mismatch',
      detail: expect.stringContaining(`${file}: expected `) as string,
    })
  })

  it('refuse un classeur absent du disque', async () => {
    const directory = copyDataDirectory()
    rmSync(join(directory, folder, cerenWorkbook))
    expect((await readResidentialEnergySources(directory))._unsafeUnwrapErr()).toMatchObject({
      reason: 'unreadable',
      detail: expect.stringContaining(cerenWorkbook) as string,
    })
  })

  it('refuse un fichier qui n’est pas un classeur, même avec la bonne empreinte', async () => {
    const directory = copyDataDirectory()
    const content = 'ce n’est pas un classeur'
    writeFileSync(join(directory, folder, cerenWorkbook), content)
    setSourceChecksum({
      directory,
      folder,
      file: cerenWorkbook,
      checksum: createHash('sha256').update(content).digest('hex'),
    })
    expect((await readResidentialEnergySources(directory))._unsafeUnwrapErr()).toMatchObject({
      dataset: `residentiel-sobriete/${cerenWorkbook}`,
      reason: 'unreadable',
      detail: expect.stringContaining(`${cerenWorkbook}: `) as string,
    })
  })

  it('refuse un manifeste qui ne déclare plus une source', async () => {
    const directory = copyDataDirectory()
    removeSourceFromManifest({ directory, folder, file: irisElectricityCsv })
    expect((await readResidentialEnergySources(directory))._unsafeUnwrapErr()).toEqual({
      kind: 'invalid_dataset',
      dataset: `residentiel-sobriete/${irisElectricityCsv}`,
      reason: 'invalid_manifest',
      detail: irisElectricityCsv,
    })
  })

  it('refuse un dossier de données sans les jeux du résidentiel', async () => {
    expect(
      (await readResidentialEnergySources(createTemporaryDirectory()))._unsafeUnwrapErr(),
    ).toMatchObject({
      dataset: 'residentiel-sobriete/regions.csv',
      reason: 'unknown_dataset',
    })
  })
})
