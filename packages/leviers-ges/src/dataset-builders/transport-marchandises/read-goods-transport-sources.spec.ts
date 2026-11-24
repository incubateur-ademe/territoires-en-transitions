import { rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  copyDataFolders,
  createTemporaryDirectory,
  removeSourceFromManifest,
  removeSourcesFromManifest,
} from '../../testing/data-folders.ts'
import { readGoodsTransportSources } from './read-goods-transport-sources.ts'

const committedDataDirectory = join(import.meta.dirname, '..', '..', '..', 'data')
const folder = 'transport-marchandises'

function copyDataDirectory(): string {
  return copyDataFolders({ from: committedDataDirectory, folders: [folder] })
}

describe('readGoodsTransportSources', () => {
  it('lit les trois relevés versionnés dont les empreintes correspondent au manifeste', () => {
    const sources = readGoodsTransportSources(committedDataDirectory)._unsafeUnwrap()
    expect({
      tonneKilometres: sources.tonneKilometresCsv.slice(0, 6),
      fleet: sources.fleetCsv.slice(0, 11),
      ominea: sources.omineaCsv.slice(0, 4),
    }).toEqual({ tonneKilometres: 'region', fleet: 'code_region', ominea: 'snap' })
  })

  it('refuse un relevé modifié depuis son extraction', () => {
    const directory = copyDataDirectory()
    writeFileSync(join(directory, folder, 'sources', 'sdes-parc-poids-lourds-2024-par-region.csv'), 'autre')
    expect(readGoodsTransportSources(directory)._unsafeUnwrapErr()).toMatchObject({
      kind: 'invalid_dataset',
      dataset: 'transport-marchandises/regions',
      reason: 'checksum_mismatch',
    })
  })

  it('refuse un relevé absent du disque', () => {
    const directory = copyDataDirectory()
    rmSync(join(directory, folder, 'sources', 'ominea-co2-poids-lourds-diesel-g-par-vehicule-km-2024.csv'))
    expect(readGoodsTransportSources(directory)._unsafeUnwrapErr()).toMatchObject({
      dataset: 'transport-marchandises/regions',
      reason: 'unreadable',
    })
  })

  it('refuse un relevé que le manifeste ne déclare pas', () => {
    const directory = copyDataDirectory()
    removeSourceFromManifest({
      directory,
      folder,
      file: 'sources/sdes-parc-poids-lourds-2024-par-region.csv',
    })
    expect(readGoodsTransportSources(directory)._unsafeUnwrapErr()).toEqual({
      kind: 'invalid_dataset',
      dataset: 'transport-marchandises/regions',
      reason: 'invalid_manifest',
      detail: 'sources/sdes-parc-poids-lourds-2024-par-region.csv',
    })
  })

  it('refuse un manifeste sans aucun champ sources', () => {
    const directory = copyDataDirectory()
    removeSourcesFromManifest({ directory, folder })
    expect(readGoodsTransportSources(directory)._unsafeUnwrapErr()).toMatchObject({
      reason: 'invalid_manifest',
    })
  })

  it('refuse un dossier de données sans le jeu des régions', () => {
    expect(readGoodsTransportSources(createTemporaryDirectory())._unsafeUnwrapErr()).toMatchObject({
      dataset: 'transport-marchandises/regions',
      reason: 'unknown_dataset',
    })
  })
})
