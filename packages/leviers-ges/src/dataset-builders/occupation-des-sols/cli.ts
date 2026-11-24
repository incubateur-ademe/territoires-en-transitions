import { createHash } from 'node:crypto'
import { writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { Result } from 'neverthrow'
import { buildOccupationData } from './build-occupation-data.ts'
import { buildTerritoryOccupation } from './build-territory-occupation.ts'
import { readOccupationSources } from './read-occupation-sources.ts'

const dataDirectory = join(import.meta.dirname, '..', '..', '..', 'data')

const occupationBuild = readOccupationSources(dataDirectory).andThen((sources) =>
  Result.combine([
    buildOccupationData(sources),
    buildTerritoryOccupation({ ...sources, territoryKind: 'departement' }),
    buildTerritoryOccupation({ ...sources, territoryKind: 'region' }),
  ]),
)

function checksumOf(csv: string): string {
  return createHash('sha256').update(csv).digest('hex')
}

function writeDataset({ file, csv }: { file: string; csv: string }): readonly [string, string] {
  writeFileSync(join(dataDirectory, 'occupation-des-sols', file), csv)
  return [file, checksumOf(csv)]
}

if (occupationBuild.isErr()) {
  console.error(JSON.stringify(occupationBuild.error))
  process.exitCode = 1
} else {
  const [epci, departements, regions] = occupationBuild.value
  const { surfacesCsv, factorsCsv, ...summary } = epci
  const checksums = Object.fromEntries([
    writeDataset({ file: 'epcis-surfaces.csv', csv: surfacesCsv }),
    writeDataset({ file: 'epcis-facteurs.csv', csv: factorsCsv }),
    writeDataset({ file: 'departements-surfaces.csv', csv: departements.surfacesCsv }),
    writeDataset({ file: 'departements-facteurs.csv', csv: departements.factorsCsv }),
    writeDataset({ file: 'regions-surfaces.csv', csv: regions.surfacesCsv }),
    writeDataset({ file: 'regions-facteurs.csv', csv: regions.factorsCsv }),
  ])
  console.log(
    JSON.stringify({
      checksums,
      ...summary,
      departementCount: departements.territoryCount,
      regionCount: regions.territoryCount,
      departementSurfaceTotals: departements.surfaceTotals,
      regionSurfaceTotals: regions.surfaceTotals,
    }),
  )
}
