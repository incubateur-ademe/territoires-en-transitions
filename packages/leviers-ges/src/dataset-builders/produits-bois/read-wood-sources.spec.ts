import { rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  copyDataFolders,
  removeSourceFromManifest,
  removeSourcesFromManifest,
} from '../../testing/data-folders.ts'
import { readWoodSources } from './read-wood-sources.ts'

const committedDataDirectory = join(import.meta.dirname, '..', '..', '..', 'data')
const folder = 'produits-bois'
const harvestFile = 'sources/agreste-exfnr00-recolte-bois-2018-2022.csv'

function copyDataDirectory(): string {
  return copyDataFolders({ from: committedDataDirectory, folders: [folder] })
}

describe('readWoodSources', () => {
  it('lit les deux sources versionnées dont les empreintes correspondent au manifeste', () => {
    const sources = readWoodSources(committedDataDirectory)._unsafeUnwrap()
    expect({
      harvestStartsWith: sources.harvestCsv.slice(0, 5),
      productsCarbonStartsWith: sources.productsCarbonCsv.slice(0, 5),
    }).toEqual({ harvestStartsWith: 'annee', productsCarbonStartsWith: 'annee' })
  })

  it('refuse une source modifiée depuis son relevé', () => {
    const directory = copyDataDirectory()
    writeFileSync(join(directory, folder, harvestFile), 'autre')
    expect(readWoodSources(directory)._unsafeUnwrapErr()).toMatchObject({
      kind: 'invalid_dataset',
      dataset: 'produits-bois/constants',
      reason: 'checksum_mismatch',
      detail: expect.stringContaining(`${harvestFile}: expected `) as string,
    })
  })

  it('refuse une source absente du disque', () => {
    const directory = copyDataDirectory()
    rmSync(join(directory, folder, harvestFile))
    expect(readWoodSources(directory)._unsafeUnwrapErr()).toMatchObject({
      dataset: 'produits-bois/constants',
      reason: 'unreadable',
    })
  })

  it('refuse une source que le manifeste ne déclare pas', () => {
    const directory = copyDataDirectory()
    removeSourceFromManifest({ directory, folder, file: harvestFile })
    expect(readWoodSources(directory)._unsafeUnwrapErr()).toEqual({
      kind: 'invalid_dataset',
      dataset: 'produits-bois/constants',
      reason: 'invalid_manifest',
      detail: harvestFile,
    })
  })

  it('refuse un manifeste sans aucun champ sources', () => {
    const directory = copyDataDirectory()
    removeSourcesFromManifest({ directory, folder })
    expect(readWoodSources(directory)._unsafeUnwrapErr()).toMatchObject({
      dataset: 'produits-bois/constants',
      reason: 'invalid_manifest',
    })
  })

  it('refuse un dossier sans manifeste', () => {
    const directory = copyDataFolders({ from: committedDataDirectory, folders: [] })
    expect(readWoodSources(directory)._unsafeUnwrapErr()).toMatchObject({
      dataset: 'produits-bois/constants',
      reason: 'unknown_dataset',
    })
  })
})
