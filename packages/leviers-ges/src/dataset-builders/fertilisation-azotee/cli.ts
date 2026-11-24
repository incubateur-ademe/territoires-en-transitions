import { writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { buildOrganicAreas } from './build-organic-areas.ts'
import { buildNitrogenDeliveries } from './build-nitrogen-deliveries.ts'
import { readNitrogenSources } from './read-nitrogen-sources.ts'
import { readOrganicSources } from './read-organic-sources.ts'

const dataDirectory = join(import.meta.dirname, '..', '..', '..', 'data')

const deliveriesBuild = readNitrogenSources(dataDirectory).andThen(buildNitrogenDeliveries)

const organicBuild = readOrganicSources(dataDirectory).andThen(buildOrganicAreas)

if (deliveriesBuild.isErr()) {
  console.error(JSON.stringify(deliveriesBuild.error))
  process.exitCode = 1
} else if (organicBuild.isErr()) {
  console.error(JSON.stringify(organicBuild.error))
  process.exitCode = 1
} else {
  const { epciDepartementsCsv, departementsCsv, ...organicSummary } = organicBuild.value
  writeFileSync(
    join(dataDirectory, 'fertilisation-azotee', 'organic-epci-departements.csv'),
    epciDepartementsCsv,
  )
  writeFileSync(join(dataDirectory, 'fertilisation-azotee', 'organic-departements.csv'), departementsCsv)
  const { regions, departements } = deliveriesBuild.value
  writeFileSync(join(dataDirectory, 'fertilisation-azotee', 'regions.csv'), regions.csv)
  writeFileSync(join(dataDirectory, 'fertilisation-azotee', 'departements.csv'), departements.csv)
  console.log(
    JSON.stringify({
      regions: regions.count,
      departements: departements.count,
      regionTonnes: [regions.previousCampaignTonnes, regions.latestCampaignTonnes],
      departementTonnes: [departements.previousCampaignTonnes, departements.latestCampaignTonnes],
      ...organicSummary,
    }),
  )
}
