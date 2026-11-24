import { rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  copyDataFolders,
  removeSourceFromManifest,
  removeSourcesFromManifest,
} from '../../testing/data-folders.ts'
import { readForestSourceText } from './read-forest-source.ts'

const committedDataDirectory = join(import.meta.dirname, '..', '..', '..', 'data')
const folder = 'produits-bois'
const forestFile = 'sources/aldo-stocks-carbone-communes-surfaces-foret.csv'

function copyDataDirectory(): string {
  return copyDataFolders({ from: committedDataDirectory, folders: [folder] })
}

describe('readForestSourceText', () => {
  it('lit la source versionnée dont l’empreinte correspond au manifeste', () => {
    expect(readForestSourceText(committedDataDirectory)._unsafeUnwrap().slice(0, 12)).toBe(
      'insee,epci,d',
    )
  })

  it('refuse une source modifiée depuis son relevé', () => {
    const directory = copyDataDirectory()
    writeFileSync(join(directory, folder, forestFile), 'autre')
    expect(readForestSourceText(directory)._unsafeUnwrapErr()).toMatchObject({
      dataset: 'produits-bois/foret-departement',
      reason: 'checksum_mismatch',
    })
  })

  it('refuse une source absente du disque', () => {
    const directory = copyDataDirectory()
    rmSync(join(directory, folder, forestFile))
    expect(readForestSourceText(directory)._unsafeUnwrapErr()).toMatchObject({
      reason: 'unreadable',
    })
  })

  it('refuse une source que le manifeste ne déclare pas', () => {
    const directory = copyDataDirectory()
    removeSourceFromManifest({ directory, folder, file: forestFile })
    expect(readForestSourceText(directory)._unsafeUnwrapErr()).toMatchObject({
      reason: 'invalid_manifest',
      detail: forestFile,
    })
  })

  it('refuse un manifeste sans aucun champ sources', () => {
    const directory = copyDataDirectory()
    removeSourcesFromManifest({ directory, folder })
    expect(readForestSourceText(directory)._unsafeUnwrapErr()).toMatchObject({
      reason: 'invalid_manifest',
    })
  })

  it('refuse un dossier sans manifeste', () => {
    const directory = copyDataFolders({ from: committedDataDirectory, folders: [] })
    expect(readForestSourceText(directory)._unsafeUnwrapErr()).toMatchObject({
      reason: 'unknown_dataset',
    })
  })
})
