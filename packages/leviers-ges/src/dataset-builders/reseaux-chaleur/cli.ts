import { writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { buildNetworks } from './build-networks.ts'
import { readNetworkSources } from './read-network-sources.ts'

const dataDirectory = join(import.meta.dirname, '..', '..', '..', 'data')

const networksBuild = readNetworkSources(dataDirectory).andThen(buildNetworks)

if (networksBuild.isErr()) {
  console.error(JSON.stringify(networksBuild.error))
  process.exitCode = 1
} else {
  const { csv, networkCount, secretNetworkCount, totalDeliveredMwh } = networksBuild.value
  writeFileSync(join(dataDirectory, 'reseaux-chaleur', 'networks.csv'), csv)
  console.log(
    JSON.stringify({ networks: networkCount, secret: secretNetworkCount, mwh: totalDeliveredMwh }),
  )
}
