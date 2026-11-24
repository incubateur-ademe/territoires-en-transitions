import { createHash } from 'node:crypto'
import { writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { buildForestAreas } from './build-forest-areas.ts'
import { buildWoodProduction } from './build-wood-production.ts'
import { readForestSourceText } from './read-forest-source.ts'
import { readWoodSources } from './read-wood-sources.ts'

const dataDirectory = join(import.meta.dirname, '..', '..', '..', 'data')

const woodBuild = readWoodSources(dataDirectory).andThen(buildWoodProduction)

const forestBuild = readForestSourceText(dataDirectory).andThen(buildForestAreas)

function checksumOf(csv: string): string {
  return createHash('sha256').update(csv).digest('hex')
}

if (woodBuild.isErr()) {
  console.error(JSON.stringify(woodBuild.error))
  process.exitCode = 1
} else if (forestBuild.isErr()) {
  console.error(JSON.stringify(forestBuild.error))
  process.exitCode = 1
} else {
  const { epciDepartementsCsv, departementsCsv: forestDepartementsCsv, ...forestSummary } =
    forestBuild.value
  writeFileSync(join(dataDirectory, 'produits-bois', 'foret-epci-departement.csv'), epciDepartementsCsv)
  writeFileSync(join(dataDirectory, 'produits-bois', 'foret-departement.csv'), forestDepartementsCsv)
  const { regionsCsv, departementsCsv, constantsCsv, ...summary } = woodBuild.value
  writeFileSync(join(dataDirectory, 'produits-bois', 'regions.csv'), regionsCsv)
  writeFileSync(join(dataDirectory, 'produits-bois', 'departements.csv'), departementsCsv)
  writeFileSync(join(dataDirectory, 'produits-bois', 'constants.csv'), constantsCsv)
  console.log(
    JSON.stringify({
      checksums: {
        'regions.csv': checksumOf(regionsCsv),
        'departements.csv': checksumOf(departementsCsv),
        'constants.csv': checksumOf(constantsCsv),
        'foret-epci-departement.csv': checksumOf(epciDepartementsCsv),
        'foret-departement.csv': checksumOf(forestDepartementsCsv),
      },
      ...summary,
      ...forestSummary,
    }),
  )
}
