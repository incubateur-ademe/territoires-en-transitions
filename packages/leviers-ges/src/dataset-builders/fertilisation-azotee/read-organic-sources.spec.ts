import { rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  copyDataFolders,
  removeSourceFromManifest,
  removeSourcesFromManifest,
} from '../../testing/data-folders.ts'
import { readOrganicSources } from './read-organic-sources.ts'

const committedDataDirectory = join(import.meta.dirname, '..', '..', '..', 'data')
const folder = 'fertilisation-azotee'
const epciFile = 'sources/agence-bio-surfaces-epci-2024.csv'
const departementFile = 'sources/agence-bio-surfaces-departements-2024.csv'

function copyDataDirectory(): string {
  return copyDataFolders({ from: committedDataDirectory, folders: [folder] })
}

describe('readOrganicSources', () => {
  it('lit les deux sources versionnées dont les empreintes correspondent au manifeste', () => {
    const sources = readOrganicSources(committedDataDirectory)._unsafeUnwrap()
    expect({
      epci: sources.epciOrganicCsv.split('\n')[0],
      departement: sources.departementOrganicCsv.split('\n')[0],
    }).toEqual({
      epci: '"annee","coderegion","region","codedepartement","departement","codeepci","epci","nb_exp","surfab","surfc1","surfc2","surfc3","surfc123","surfbio"',
      departement:
        '"annee","coderegion","region","codedepartement","departement","nb_exp","surfab","surfc1","surfc2","surfc3","surfc123","surfbio"',
    })
  })

  it('refuse une source EPCI modifiée depuis son relevé', () => {
    const directory = copyDataDirectory()
    writeFileSync(join(directory, folder, epciFile), 'autre')
    expect(readOrganicSources(directory)._unsafeUnwrapErr()).toMatchObject({
      dataset: 'fertilisation-azotee/organic-epci-departements',
      reason: 'checksum_mismatch',
    })
  })

  it('refuse une source départementale absente du disque', () => {
    const directory = copyDataDirectory()
    rmSync(join(directory, folder, departementFile))
    expect(readOrganicSources(directory)._unsafeUnwrapErr()).toMatchObject({
      dataset: 'fertilisation-azotee/organic-departements',
      reason: 'unreadable',
    })
  })

  it('refuse une source que le manifeste ne déclare pas', () => {
    const directory = copyDataDirectory()
    removeSourceFromManifest({ directory, folder, file: epciFile })
    expect(readOrganicSources(directory)._unsafeUnwrapErr()).toMatchObject({
      reason: 'invalid_manifest',
      detail: epciFile,
    })
  })

  it('refuse un manifeste sans aucun champ sources', () => {
    const directory = copyDataDirectory()
    removeSourcesFromManifest({ directory, folder })
    expect(readOrganicSources(directory)._unsafeUnwrapErr()).toMatchObject({
      reason: 'invalid_manifest',
    })
  })

  it('refuse un dossier sans manifeste', () => {
    const directory = copyDataFolders({ from: committedDataDirectory, folders: [] })
    expect(readOrganicSources(directory)._unsafeUnwrapErr()).toMatchObject({
      reason: 'unknown_dataset',
    })
  })
})
