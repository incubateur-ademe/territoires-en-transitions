import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { buildNetworks } from './build-networks.ts'
import { readNetworkSources } from './read-network-sources.ts'

const dataDirectory = join(import.meta.dirname, '..', '..', '..', 'data')
const committedNetworksCsv = readFileSync(
  join(dataDirectory, 'reseaux-chaleur', 'networks.csv'),
  'utf8',
)

describe('buildNetworks, sources versionnées SDES 2024 et France Chaleur Urbaine', () => {
  const build = readNetworkSources(dataDirectory).andThen(buildNetworks)._unsafeUnwrap()

  it('reconstruit networks.csv à l’identique', () => {
    expect(build.csv).toBe(committedNetworksCsv)
  })

  it('compte 852 réseaux, 140 réseaux sous secret et 27 733 931,728493 MWh', () => {
    expect({
      networks: build.networkCount,
      secret: build.secretNetworkCount,
      mwh: build.totalDeliveredMwh,
    }).toEqual({ networks: 852, secret: 140, mwh: '27733931.728493' })
  })
})
