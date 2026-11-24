import { rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  copyDataFolders,
  removeSourceFromManifest,
  removeSourcesFromManifest,
} from '../../testing/data-folders.ts'
import { readEpciSources } from './read-epci-sources.ts'

const committedDataDirectory = join(import.meta.dirname, '..', '..', '..', 'data')
const folder = 'residentiel-sobriete'
const electricityFile = 'sources/sdes-electricite-epci-2024-residentiel.csv'

function copyDataDirectory(): string {
  return copyDataFolders({ from: committedDataDirectory, folders: [folder] })
}

describe('readEpciSources', () => {
  it('lit les deux extraits versionnés dont l’empreinte correspond au manifeste', () => {
    const sources = readEpciSources(committedDataDirectory)._unsafeUnwrap()
    expect({
      electricity: sources.epciElectricityCsv.split('\n')[0],
      gas: sources.epciGasCsv.split('\n')[0],
    }).toEqual({
      electricity: 'operateur,code_epci,conso_mwh,points_livraison',
      gas: 'operateur,code_epci,conso_mwh,points_livraison',
    })
  })

  it('refuse un extrait modifié depuis son relevé', () => {
    const directory = copyDataDirectory()
    writeFileSync(join(directory, folder, electricityFile), 'autre')
    expect(readEpciSources(directory)._unsafeUnwrapErr()).toMatchObject({
      dataset: `residentiel-sobriete/${electricityFile}`,
      reason: 'checksum_mismatch',
    })
  })

  it('refuse un extrait absent du disque', () => {
    const directory = copyDataDirectory()
    rmSync(join(directory, folder, electricityFile))
    expect(readEpciSources(directory)._unsafeUnwrapErr()).toMatchObject({ reason: 'unreadable' })
  })

  it('refuse un extrait que le manifeste ne déclare pas', () => {
    const directory = copyDataDirectory()
    removeSourceFromManifest({ directory, folder, file: electricityFile })
    expect(readEpciSources(directory)._unsafeUnwrapErr()).toMatchObject({
      reason: 'invalid_manifest',
      detail: electricityFile,
    })
  })

  it('refuse un manifeste sans aucun champ sources', () => {
    const directory = copyDataDirectory()
    removeSourcesFromManifest({ directory, folder })
    expect(readEpciSources(directory)._unsafeUnwrapErr()).toMatchObject({
      reason: 'invalid_manifest',
    })
  })

  it('refuse un dossier sans manifeste', () => {
    const directory = copyDataFolders({ from: committedDataDirectory, folders: [] })
    expect(readEpciSources(directory)._unsafeUnwrapErr()).toMatchObject({
      dataset: 'residentiel-sobriete/epcis.csv',
      reason: 'unknown_dataset',
    })
  })
})
