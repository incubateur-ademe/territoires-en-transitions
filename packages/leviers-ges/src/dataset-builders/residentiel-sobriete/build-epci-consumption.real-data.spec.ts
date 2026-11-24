import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { createCsvDataSource } from '../../infrastructure/csv/csv-data-source.ts'
import { buildEpciConsumption } from './build-epci-consumption.ts'
import { readEpciSources } from './read-epci-sources.ts'

const dataDirectory = join(import.meta.dirname, '..', '..', '..', 'data')

describe('buildEpciConsumption, extraits versionnés SDES 2024', () => {
  const epciConsumption = readEpciSources(dataDirectory).andThen(buildEpciConsumption)._unsafeUnwrap()

  it('reconstruit epcis.csv à l’identique', () => {
    expect(epciConsumption.csv).toBe(
      readFileSync(join(dataDirectory, 'residentiel-sobriete', 'epcis.csv'), 'utf8'),
    )
  })

  it('compte 1 255 EPCI, 156 127 255,6265 MWh d’électricité et 101 745 259,70506 MWh de gaz', () => {
    expect({
      epcis: epciConsumption.epciCount,
      electricity: epciConsumption.electricityMwh,
      gas: epciConsumption.naturalGasMwh,
    }).toEqual({
      epcis: 1255,
      electricity: '156127255.6265',
      gas: '101745259.70506',
    })
  })

  it('compte 58 lignes d’électricité et 17 lignes de gaz sous secret', () => {
    expect({
      electricity: epciConsumption.secretElectricityLineCount,
      gas: epciConsumption.secretGasLineCount,
    }).toEqual({ electricity: 58, gas: 17 })
  })

  it('l’EPCI 200000172 additionne GRDF et la régie de Bonneville : 33 929,5466 MWh de gaz', () => {
    const row = createCsvDataSource(dataDirectory)
      .rows('residentiel-sobriete/epcis')
      ._unsafeUnwrap()
      .find((candidate) => candidate['code_epci'] === '200000172')
    expect({ electricity: row?.['electricity_mwh'], gas: row?.['natural_gas_mwh'] }).toEqual({
      electricity: '66574.394',
      gas: '33929.5466',
    })
  })
})
