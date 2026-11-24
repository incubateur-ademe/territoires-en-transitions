import { writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { buildWasteTreatment } from './build-waste-treatment.ts'
import { readWasteSources } from './read-waste-sources.ts'

const dataDirectory = join(import.meta.dirname, '..', '..', '..', 'data')

const wasteBuild = readWasteSources(dataDirectory).andThen(buildWasteTreatment)

if (wasteBuild.isErr()) {
  console.error(JSON.stringify(wasteBuild.error))
  process.exitCode = 1
} else {
  const { flowsCsv, emissionFactorsCsv, flowCount, totalTonnes, storageTonnes, incinerationTonnes } =
    wasteBuild.value
  writeFileSync(join(dataDirectory, 'dechets', 'treatment-flows.csv'), flowsCsv)
  writeFileSync(join(dataDirectory, 'dechets', 'emission-factors.csv'), emissionFactorsCsv)
  console.log(
    JSON.stringify({
      flows: flowCount,
      tonnes: totalTonnes,
      storageTonnes,
      incinerationTonnes,
    }),
  )
}
