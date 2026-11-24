import { createHash } from 'node:crypto'
import { writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { buildTransportPersonnes } from './build-transport-personnes.ts'
import { readTransportSources } from './read-transport-sources.ts'

const dataDirectory = join(import.meta.dirname, '..', '..', '..', 'data')
const outputDirectory = join(dataDirectory, 'transport-personnes')

function writeLevel({
  file,
  build,
}: {
  file: string
  build: { csv: string; territoryCount: number; controlTotals: unknown }
}): void {
  writeFileSync(join(outputDirectory, file), build.csv)
  const checksum = createHash('sha256').update(build.csv).digest('hex')
  const { territoryCount, controlTotals } = build
  console.log(JSON.stringify({ file, checksum, territoryCount, controlTotals }))
}

const transportBuild = readTransportSources(dataDirectory).andThen(buildTransportPersonnes)

if (transportBuild.isErr()) {
  console.error(JSON.stringify(transportBuild.error))
  process.exitCode = 1
} else {
  const { regions, departements, epcis } = transportBuild.value
  writeLevel({ file: 'regions.csv', build: regions })
  writeLevel({ file: 'departements.csv', build: departements })
  writeLevel({ file: 'epcis.csv', build: epcis })
}
