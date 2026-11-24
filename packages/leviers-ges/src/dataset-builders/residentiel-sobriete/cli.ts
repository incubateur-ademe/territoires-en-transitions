import { createHash } from 'node:crypto'
import { writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { buildEpciConsumption } from './build-epci-consumption.ts'
import { buildResidentialEnergy } from './build-residential-energy.ts'
import { readEpciSources } from './read-epci-sources.ts'
import { readResidentialEnergySources } from './read-residential-energy-sources.ts'

const dataDirectory = join(import.meta.dirname, '..', '..', '..', 'data')
const outputDirectory = join(dataDirectory, 'residentiel-sobriete')

const residentialEnergy = await readResidentialEnergySources(dataDirectory).andThen(
  buildResidentialEnergy,
)

if (residentialEnergy.isErr()) {
  console.error(JSON.stringify(residentialEnergy.error))
  process.exitCode = 1
} else {
  const { regionsCsv, departementsCsv, heatNetworksCsv, controlTotals, secretNetworkCount } =
    residentialEnergy.value
  const outputs = [
    { file: 'regions.csv', csv: regionsCsv, controlTotals: controlTotals.regions },
    { file: 'departements.csv', csv: departementsCsv, controlTotals: controlTotals.departements },
    { file: 'heat-networks.csv', csv: heatNetworksCsv, controlTotals: controlTotals.heatNetworks },
  ]
  outputs.forEach(({ file, csv, controlTotals: totals }) => {
    writeFileSync(join(outputDirectory, file), csv)
    const checksum = createHash('sha256').update(csv).digest('hex')
    console.log(JSON.stringify({ file, checksum, controlTotals: totals }))
  })
  console.log(JSON.stringify({ secretNetworksCountedAsZero: secretNetworkCount }))
}

const epciConsumption = readEpciSources(dataDirectory).andThen(buildEpciConsumption)

if (epciConsumption.isErr()) {
  console.error(JSON.stringify(epciConsumption.error))
  process.exitCode = 1
} else {
  const { csv, ...summary } = epciConsumption.value
  writeFileSync(join(outputDirectory, 'epcis.csv'), csv)
  console.log(
    JSON.stringify({
      file: 'epcis.csv',
      checksum: createHash('sha256').update(csv).digest('hex'),
      ...summary,
    }),
  )
}
