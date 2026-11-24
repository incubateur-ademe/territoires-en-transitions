import { rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  copyDataFolders,
  createTemporaryDirectory,
  removeSourceFromManifest,
  removeSourcesFromManifest,
} from '../../testing/data-folders.ts'
import { readNetworkSources } from './read-network-sources.ts'

const committedDataDirectory = join(import.meta.dirname, '..', '..', '..', 'data')
const folder = 'reseaux-chaleur'

function copyDataDirectory(): string {
  return copyDataFolders({ from: committedDataDirectory, folders: [folder] })
}

describe('readNetworkSources', () => {
  it('lit les deux sources versionnées dont les empreintes correspondent au manifeste', () => {
    const sources = readNetworkSources(committedDataDirectory)._unsafeUnwrap()
    expect({
      sdesStartsWith: sources.sdesCsv.slice(0, 4),
      fcuStartsWith: sources.fcuCsv.slice(0, 6),
    }).toEqual({ sdesStartsWith: '"ID"', fcuStartsWith: 'id_fcu' })
  })

  it('refuse une source modifiée depuis son relevé', () => {
    const directory = copyDataDirectory()
    writeFileSync(join(directory, folder, 'sources', 'fcu-reseaux-chaleur.csv'), 'autre')
    expect(readNetworkSources(directory)._unsafeUnwrapErr()).toMatchObject({
      kind: 'invalid_dataset',
      dataset: 'reseaux-chaleur/networks',
      reason: 'checksum_mismatch',
      detail: expect.stringContaining('sources/fcu-reseaux-chaleur.csv: expected ') as string,
    })
  })

  it('refuse une source absente du disque', () => {
    const directory = copyDataDirectory()
    rmSync(join(directory, folder, 'sources', 'sdes-chaleur-commune-2024.csv'))
    expect(readNetworkSources(directory)._unsafeUnwrapErr()).toMatchObject({
      dataset: 'reseaux-chaleur/networks',
      reason: 'unreadable',
    })
  })

  it('refuse une source que le manifeste ne déclare pas', () => {
    const directory = copyDataDirectory()
    removeSourceFromManifest({ directory, folder, file: 'sources/fcu-reseaux-chaleur.csv' })
    expect(readNetworkSources(directory)._unsafeUnwrapErr()).toEqual({
      kind: 'invalid_dataset',
      dataset: 'reseaux-chaleur/networks',
      reason: 'invalid_manifest',
      detail: 'sources/fcu-reseaux-chaleur.csv',
    })
  })

  it('refuse un manifeste sans aucun champ sources', () => {
    const directory = copyDataDirectory()
    removeSourcesFromManifest({ directory, folder })
    expect(readNetworkSources(directory)._unsafeUnwrapErr()).toEqual({
      kind: 'invalid_dataset',
      dataset: 'reseaux-chaleur/networks',
      reason: 'invalid_manifest',
      detail: 'sources/sdes-chaleur-commune-2024.csv',
    })
  })

  it('refuse un dossier de données sans le jeu des réseaux', () => {
    expect(readNetworkSources(createTemporaryDirectory())._unsafeUnwrapErr()).toMatchObject({
      dataset: 'reseaux-chaleur/networks',
      reason: 'unknown_dataset',
    })
  })
})
