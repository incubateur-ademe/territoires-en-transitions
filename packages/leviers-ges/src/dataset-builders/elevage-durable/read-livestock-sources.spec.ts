import { rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  copyDataFolders,
  createTemporaryDirectory,
  removeSourceFromManifest,
  removeSourcesFromManifest,
} from '../../testing/data-folders.ts'
import { readLivestockSources } from './read-livestock-sources.ts'

const committedDataDirectory = join(import.meta.dirname, '..', '..', '..', 'data')
const folder = 'elevage-durable'

function copyDataDirectory(): string {
  return copyDataFolders({ from: committedDataDirectory, folders: [folder] })
}

describe('readLivestockSources', () => {
  it('lit les deux relevés versionnés dont les empreintes correspondent au manifeste', () => {
    const sources = readLivestockSources(committedDataDirectory)._unsafeUnwrap()
    expect({
      agresteStartsWith: sources.agresteCsv.slice(0, 10),
      cartostatStartsWith: sources.cartostatCsv.slice(0, 5),
    }).toEqual({ agresteStartsWith: 'geographie', cartostatStartsWith: 'maill' })
  })

  it('refuse un relevé modifié depuis son extraction', () => {
    const directory = copyDataDirectory()
    writeFileSync(
      join(directory, folder, 'sources', 'agreste-ra2020-cheptels-departement-region.csv'),
      'autre',
    )
    expect(readLivestockSources(directory)._unsafeUnwrapErr()).toMatchObject({
      kind: 'invalid_dataset',
      dataset: 'elevage-durable/regions',
      reason: 'checksum_mismatch',
    })
  })

  it('refuse un relevé absent du disque', () => {
    const directory = copyDataDirectory()
    rmSync(
      join(directory, folder, 'sources', 'cartostat-vaches-laitieres-2020-departements-regions.csv'),
    )
    expect(readLivestockSources(directory)._unsafeUnwrapErr()).toMatchObject({
      dataset: 'elevage-durable/regions',
      reason: 'unreadable',
    })
  })

  it('refuse un relevé que le manifeste ne déclare pas', () => {
    const directory = copyDataDirectory()
    removeSourceFromManifest({
      directory,
      folder,
      file: 'sources/cartostat-vaches-laitieres-2020-departements-regions.csv',
    })
    expect(readLivestockSources(directory)._unsafeUnwrapErr()).toEqual({
      kind: 'invalid_dataset',
      dataset: 'elevage-durable/regions',
      reason: 'invalid_manifest',
      detail: 'sources/cartostat-vaches-laitieres-2020-departements-regions.csv',
    })
  })

  it('refuse un manifeste sans aucun champ sources', () => {
    const directory = copyDataDirectory()
    removeSourcesFromManifest({ directory, folder })
    expect(readLivestockSources(directory)._unsafeUnwrapErr()).toMatchObject({
      reason: 'invalid_manifest',
    })
  })

  it('refuse un dossier de données sans le jeu des régions', () => {
    expect(readLivestockSources(createTemporaryDirectory())._unsafeUnwrapErr()).toMatchObject({
      dataset: 'elevage-durable/regions',
      reason: 'unknown_dataset',
    })
  })
})
