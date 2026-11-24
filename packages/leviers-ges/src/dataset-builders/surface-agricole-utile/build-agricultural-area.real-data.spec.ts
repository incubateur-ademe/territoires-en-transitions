import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { sum, toBig } from '../../domain/big-number.ts'
import { createCsvDataSource } from '../../infrastructure/csv/csv-data-source.ts'
import { buildAgriculturalArea } from './build-agricultural-area.ts'
import { readAgriculturalAreaSources } from './read-agricultural-area-sources.ts'

const dataDirectory = join(import.meta.dirname, '..', '..', '..', 'data')
const dataSource = createCsvDataSource(dataDirectory)

const SOURCE_READING_TIMEOUT_MS = 30_000

describe('SAU par commune, recensement agricole 2020', { timeout: SOURCE_READING_TIMEOUT_MS }, () => {
  it('reconstruit communes.csv à l’identique', () => {
    const build = readAgriculturalAreaSources(dataDirectory)
      .andThen(buildAgriculturalArea)
      ._unsafeUnwrap()
    const committed = readFileSync(
      join(dataDirectory, 'surface-agricole-utile', 'communes.csv'),
      'utf8',
    )
    expect(build.csv).toBe(committed)
  })

  describe('lue par le chargeur CSV, empreinte et total de contrôle vérifiés', () => {
    const communes = dataSource.rows('surface-agricole-utile/communes')._unsafeUnwrap()
    const geography = dataSource.rows('territoires/communes')._unsafeUnwrap()
    const departementByCommune = new Map(
      geography.map((row) => [row['code_commune'], row['code_departement']]),
    )
    const hectaresOf = (code: string): string =>
      communes.find((row) => row['code_commune'] === code)?.['agricultural_area_ha'] ?? ''

    it('compte 33 585 communes pour 26 865 430,03 ha', () => {
      expect({
        communes: communes.length,
        hectares: sum(communes.map((row) => toBig(row['agricultural_area_ha'] ?? ''))).decimalPlaces(2).toFixed(),
      }).toEqual({ communes: 33_585, hectares: '26865430.03' })
    })

    it('chaque commune écrite est dans la géographie', () => {
      const unknown = communes.filter((row) => !departementByCommune.has(row['code_commune'] ?? ''))
      expect(unknown).toEqual([])
    })

    it('l’Eure-et-Loir compte 446 392,34 ha, comme la fiche de fertilisation azotée', () => {
      const hectares = communes
        .filter((row) => departementByCommune.get(row['code_commune'] ?? '') === '28')
        .map((row) => toBig(row['agricultural_area_ha'] ?? ''))
      expect(sum(hectares).toFixed()).toBe('446392.34')
    })

    it('Paris compte 1,01 ha, soit 1 ha comme la fiche', () => {
      expect(hectaresOf('75056')).toBe('1.01')
    })

    it.each([
      ['12218', '4088.42', 'Conques-en-Rouergue'],
      ['14581', '3727.21', 'Aurseulles'],
      ['49126', '10831.36', 'Orée d’Anjou'],
      ['69114', '618.56', 'Porte des Pierres Dorées'],
    ])('la commune recodée %s (%s) porte la SAU de %s', (code, expected) => {
      expect(hectaresOf(code)).toBe(expected)
    })

    it('Ingrandes-le-Fresne-sur-Loire (49160) s’ajoute la SAU de Saint-Sigismond (495,44 ha)', () => {
      expect(hectaresOf('49160')).toBe('817.2')
    })

    it('ne garde aucun des anciens codes recodés', () => {
      const oldCodes = ['12076', '14011', '49069', '49321', '69159']
      expect(oldCodes.filter((code) => hectaresOf(code) !== '')).toEqual([])
    })
  })
})
