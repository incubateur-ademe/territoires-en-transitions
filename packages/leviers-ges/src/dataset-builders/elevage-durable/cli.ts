import { writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { buildLivestockHeadcounts } from './build-livestock-headcounts.ts'
import { readLivestockSources } from './read-livestock-sources.ts'

const dataDirectory = join(import.meta.dirname, '..', '..', '..', 'data')

const headcountsBuild = readLivestockSources(dataDirectory).andThen(buildLivestockHeadcounts)

if (headcountsBuild.isErr()) {
  console.error(JSON.stringify(headcountsBuild.error))
  process.exitCode = 1
} else {
  const { regions, departements } = headcountsBuild.value
  writeFileSync(join(dataDirectory, 'elevage-durable', 'regions.csv'), regions.csv)
  writeFileSync(join(dataDirectory, 'elevage-durable', 'departements.csv'), departements.csv)
  console.log(
    JSON.stringify({
      regions: { territories: regions.territoryCount, secretCells: regions.secretCellCount, totals: regions.totals },
      departements: {
        territories: departements.territoryCount,
        secretCells: departements.secretCellCount,
        totals: departements.totals,
      },
    }),
  )
}
