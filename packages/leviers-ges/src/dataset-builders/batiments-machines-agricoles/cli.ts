import { createHash } from 'node:crypto'
import { writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { buildAgriculturalEnergy } from './build-agricultural-energy.ts'
import { readAgriculturalEnergySources } from './read-agricultural-energy-sources.ts'

const dataDirectory = join(import.meta.dirname, '..', '..', '..', 'data')
const outputDirectory = join(dataDirectory, 'batiments-machines-agricoles')

const agriculturalEnergy = await readAgriculturalEnergySources(dataDirectory).andThen(
  buildAgriculturalEnergy,
)

if (agriculturalEnergy.isErr()) {
  console.error(JSON.stringify(agriculturalEnergy.error))
  process.exitCode = 1
} else {
  const { regionsCsv, departementsCsv, epcisCsv, controlTotals, secretLineCounts } =
    agriculturalEnergy.value
  const outputs = [
    { file: 'regions.csv', csv: regionsCsv, controlTotals: controlTotals.regions },
    { file: 'departements.csv', csv: departementsCsv, controlTotals: controlTotals.departements },
    { file: 'epcis.csv', csv: epcisCsv, controlTotals: controlTotals.epcis },
  ]
  outputs.forEach(({ file, csv, controlTotals: totals }) => {
    writeFileSync(join(outputDirectory, file), csv)
    const checksum = createHash('sha256').update(csv).digest('hex')
    console.log(JSON.stringify({ file, checksum, controlTotals: totals }))
  })
  console.log(JSON.stringify({ secretLinesCountedAsZero: secretLineCounts }))
}
