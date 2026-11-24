import { rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  copyDataFolders,
  removeSourceFromManifest,
  removeSourcesFromManifest,
} from '../../testing/data-folders.ts'
import { HOUSING_COLUMNS } from './housing-cells.ts'
import { readHousingCommunes, readHousingSourceText } from './read-housing-source.ts'

const committedDataDirectory = join(import.meta.dirname, '..', '..', '..', 'data')
const folder = 'residentiel-logements'
const housingFile = 'sources/insee-rp2022-logements-communes.csv'

function copyDataDirectory(): string {
  return copyDataFolders({ from: committedDataDirectory, folders: [folder] })
}

function housing(...lines: readonly string[]): string {
  return `${['commune,epci,departement,' + HOUSING_COLUMNS.join(','), ...lines].join('\n')}\n`
}

const zeros = HOUSING_COLUMNS.map(() => '0')

describe('readHousingSourceText', () => {
  it('lit la source versionnée dont l’empreinte correspond au manifeste', () => {
    expect(readHousingSourceText(committedDataDirectory)._unsafeUnwrap().split('\n')[0]).toBe(
      ['commune', 'epci', 'departement', ...HOUSING_COLUMNS].join(','),
    )
  })

  it('refuse une source modifiée depuis son relevé', () => {
    const directory = copyDataDirectory()
    writeFileSync(join(directory, folder, housingFile), 'autre')
    expect(readHousingSourceText(directory)._unsafeUnwrapErr()).toMatchObject({
      dataset: 'residentiel-logements/logements-departement',
      reason: 'checksum_mismatch',
    })
  })

  it('refuse une source absente du disque', () => {
    const directory = copyDataDirectory()
    rmSync(join(directory, folder, housingFile))
    expect(readHousingSourceText(directory)._unsafeUnwrapErr()).toMatchObject({
      reason: 'unreadable',
    })
  })

  it('refuse une source que le manifeste ne déclare pas', () => {
    const directory = copyDataDirectory()
    removeSourceFromManifest({ directory, folder, file: housingFile })
    expect(readHousingSourceText(directory)._unsafeUnwrapErr()).toMatchObject({
      reason: 'invalid_manifest',
      detail: housingFile,
    })
  })

  it('refuse un manifeste sans aucun champ sources', () => {
    const directory = copyDataDirectory()
    removeSourcesFromManifest({ directory, folder })
    expect(readHousingSourceText(directory)._unsafeUnwrapErr()).toMatchObject({
      reason: 'invalid_manifest',
    })
  })

  it('refuse un dossier sans manifeste', () => {
    const directory = copyDataFolders({ from: committedDataDirectory, folders: [] })
    expect(readHousingSourceText(directory)._unsafeUnwrapErr()).toMatchObject({
      reason: 'unknown_dataset',
    })
  })
})

describe('readHousingCommunes', () => {
  it('lit l’EPCI, le département et les 54 surfaces de chaque commune', () => {
    const [commune] = readHousingCommunes(housing(`01001,200000001,01,${zeros.join(',')}`))._unsafeUnwrap()
    expect({
      epci: commune?.epci,
      departement: commune?.departement,
      columnCount: Object.keys(commune?.squareMetres ?? {}).length,
    }).toEqual({ epci: '200000001', departement: '01', columnCount: 54 })
  })

  it('refuse une surface qui n’est pas un nombre décimal', () => {
    expect(
      readHousingCommunes(housing(`01001,200000001,01,abc,${zeros.slice(1).join(',')}`))._unsafeUnwrapErr(),
    ).toEqual({
      kind: 'invalid_dataset',
      dataset: 'residentiel-logements/sources/insee-rp2022-logements-communes.csv',
      reason: 'unreadable',
      detail: 'housing_m2_house_heat_network_before_1971=abc is not a decimal number',
    })
  })

  it('refuse une source sans colonne de surface', () => {
    expect(
      readHousingCommunes('commune,epci,departement\n01001,200000001,01\n')._unsafeUnwrapErr(),
    ).toMatchObject({ reason: 'columns_mismatch', detail: 'housing_m2_house_heat_network_before_1971' })
  })
})
