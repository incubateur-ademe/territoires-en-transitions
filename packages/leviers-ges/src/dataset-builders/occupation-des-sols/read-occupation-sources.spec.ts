import { rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  copyDataFolders,
  removeSourceFromManifest,
  removeSourcesFromManifest,
} from '../../testing/data-folders.ts'
import { readOccupationSources } from './read-occupation-sources.ts'

const committedDataDirectory = join(import.meta.dirname, '..', '..', '..', 'data')
const folder = 'occupation-des-sols'
const surfacesFile = 'sources/aldo-stocks-carbone-communes-surfaces.csv'
const factorsFile = 'sources/aldo-flux2-epci-facteurs.csv'
const factorSetsFile = 'sources/aldo-flux2-communes-jeux-de-facteurs.csv'

function copyDataDirectory(): string {
  return copyDataFolders({ from: committedDataDirectory, folders: [folder] })
}

describe('readOccupationSources', () => {
  it('lit les trois sources versionnées dont les empreintes correspondent au manifeste', () => {
    const sources = readOccupationSources(committedDataDirectory)._unsafeUnwrap()
    expect({
      surfaces: sources.surfacesCsv.split('\n')[0]?.slice(0, 20),
      factors: sources.factorsCsv.split('\n')[0]?.slice(0, 20),
      factorSets: sources.factorSetsCsv.split('\n')[0]?.slice(0, 20),
    }).toEqual({
      surfaces: 'insee,epci,departeme',
      factors: 'insee,prairies zones',
      factorSets: 'jeu,prairies zones a',
    })
  })

  it('refuse une source de surfaces modifiée depuis son relevé', () => {
    const directory = copyDataDirectory()
    writeFileSync(join(directory, folder, surfacesFile), 'autre')
    expect(readOccupationSources(directory)._unsafeUnwrapErr()).toMatchObject({
      dataset: 'occupation-des-sols/epcis-surfaces',
      reason: 'checksum_mismatch',
    })
  })

  it('refuse une source de facteurs absente du disque', () => {
    const directory = copyDataDirectory()
    rmSync(join(directory, folder, factorsFile))
    expect(readOccupationSources(directory)._unsafeUnwrapErr()).toMatchObject({
      dataset: 'occupation-des-sols/epcis-facteurs',
      reason: 'unreadable',
    })
  })

  it('refuse une source des jeux de facteurs modifiée depuis son relevé', () => {
    const directory = copyDataDirectory()
    writeFileSync(join(directory, folder, factorSetsFile), 'autre')
    expect(readOccupationSources(directory)._unsafeUnwrapErr()).toMatchObject({
      dataset: 'occupation-des-sols/departements-facteurs',
      reason: 'checksum_mismatch',
    })
  })

  it('refuse une source que le manifeste ne déclare pas', () => {
    const directory = copyDataDirectory()
    removeSourceFromManifest({ directory, folder, file: surfacesFile })
    expect(readOccupationSources(directory)._unsafeUnwrapErr()).toMatchObject({
      reason: 'invalid_manifest',
      detail: surfacesFile,
    })
  })

  it('refuse un manifeste sans aucun champ sources', () => {
    const directory = copyDataDirectory()
    removeSourcesFromManifest({ directory, folder })
    expect(readOccupationSources(directory)._unsafeUnwrapErr()).toMatchObject({
      reason: 'invalid_manifest',
    })
  })

  it('refuse un dossier sans manifeste', () => {
    const directory = copyDataFolders({ from: committedDataDirectory, folders: [] })
    expect(readOccupationSources(directory)._unsafeUnwrapErr()).toMatchObject({
      reason: 'unknown_dataset',
    })
  })
})
