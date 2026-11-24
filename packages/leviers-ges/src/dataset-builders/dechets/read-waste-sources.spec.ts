import { rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  copyDataFolders,
  createTemporaryDirectory,
  removeSourceFromManifest,
  removeSourcesFromManifest,
} from '../../testing/data-folders.ts'
import { readWasteSources } from './read-waste-sources.ts'

const committedDataDirectory = join(import.meta.dirname, '..', '..', '..', 'data')
const folder = 'dechets'

function copyDataDirectory(): string {
  return copyDataFolders({ from: committedDataDirectory, folders: [folder] })
}

describe('readWasteSources', () => {
  it('lit les deux sources versionnées dont les empreintes correspondent au manifeste', () => {
    const sources = readWasteSources(committedDataDirectory)._unsafeUnwrap()
    expect({
      irepStartsWith: sources.irepCsv.slice(0, 11),
      factorsStartsWith: sources.emissionFactorsText.slice(0, 9),
    }).toEqual({ irepStartsWith: 'identifiant', factorsStartsWith: 'code_irep' })
  })

  it('refuse une source modifiée depuis son relevé', () => {
    const directory = copyDataDirectory()
    writeFileSync(join(directory, folder, 'sources', 'fe-dechets-tableur.csv'), 'autre')
    expect(readWasteSources(directory)._unsafeUnwrapErr()).toMatchObject({
      kind: 'invalid_dataset',
      dataset: 'dechets/treatment-flows',
      reason: 'checksum_mismatch',
      detail: expect.stringContaining('sources/fe-dechets-tableur.csv: expected ') as string,
    })
  })

  it('refuse une source absente du disque', () => {
    const directory = copyDataDirectory()
    rmSync(join(directory, folder, 'sources', 'irep-2022-dechets-municipaux-traitement.csv'))
    expect(readWasteSources(directory)._unsafeUnwrapErr()).toMatchObject({
      dataset: 'dechets/treatment-flows',
      reason: 'unreadable',
    })
  })

  it('refuse une source que le manifeste ne déclare pas', () => {
    const directory = copyDataDirectory()
    removeSourceFromManifest({ directory, folder, file: 'sources/fe-dechets-tableur.csv' })
    expect(readWasteSources(directory)._unsafeUnwrapErr()).toEqual({
      kind: 'invalid_dataset',
      dataset: 'dechets/treatment-flows',
      reason: 'invalid_manifest',
      detail: 'sources/fe-dechets-tableur.csv',
    })
  })

  it('refuse un manifeste sans aucun champ sources', () => {
    const directory = copyDataDirectory()
    removeSourcesFromManifest({ directory, folder })
    expect(readWasteSources(directory)._unsafeUnwrapErr()).toEqual({
      kind: 'invalid_dataset',
      dataset: 'dechets/treatment-flows',
      reason: 'invalid_manifest',
      detail: 'sources/irep-2022-dechets-municipaux-traitement.csv',
    })
  })

  it('refuse un dossier de données sans le jeu des flux', () => {
    expect(readWasteSources(createTemporaryDirectory())._unsafeUnwrapErr()).toMatchObject({
      dataset: 'dechets/treatment-flows',
      reason: 'unknown_dataset',
    })
  })
})
