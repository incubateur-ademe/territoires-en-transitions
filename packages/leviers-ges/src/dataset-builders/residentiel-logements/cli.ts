import { spawn } from 'node:child_process'
import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { createInterface } from 'node:readline'
import { aggregateHousingSurfaces } from './aggregate-housing-surfaces.ts'
import { buildHousingSurfaces } from './build-housing-surfaces.ts'
import { readHousingSourceText } from './read-housing-source.ts'

const dataDirectory = join(import.meta.dirname, '..', '..', '..', 'data')

const inseeFile = 'FD_LOGEMT_2022.csv'

const sourceFile = join(
  dataDirectory,
  'residentiel-logements',
  'sources',
  'insee-rp2022-logements-communes.csv',
)

function checksumOf(csv: string): string {
  return createHash('sha256').update(csv).digest('hex')
}

async function extract(zipPath: string): Promise<void> {
  const unzip = spawn('unzip', ['-p', zipPath, inseeFile], { stdio: ['ignore', 'pipe', 'inherit'] })
  const aggregated = await aggregateHousingSurfaces({
    lines: createInterface({ input: unzip.stdout, crlfDelay: Infinity }),
    communesCsv: readFileSync(join(dataDirectory, 'territoires', 'communes.csv'), 'utf8'),
  })
  if (aggregated.isErr()) {
    console.error(JSON.stringify(aggregated.error))
    process.exitCode = 1
    return
  }
  const { csv, ...summary } = aggregated.value
  writeFileSync(sourceFile, csv)
  console.log(JSON.stringify({ checksum: checksumOf(csv), ...summary }))
}

function build(): void {
  const housingBuild = readHousingSourceText(dataDirectory).andThen(buildHousingSurfaces)
  if (housingBuild.isErr()) {
    console.error(JSON.stringify(housingBuild.error))
    process.exitCode = 1
    return
  }
  const { epciDepartementsCsv, departementsCsv, ...summary } = housingBuild.value
  writeFileSync(
    join(dataDirectory, 'residentiel-logements', 'logements-epci-departement.csv'),
    epciDepartementsCsv,
  )
  writeFileSync(
    join(dataDirectory, 'residentiel-logements', 'logements-departement.csv'),
    departementsCsv,
  )
  console.log(
    JSON.stringify({
      checksums: {
        'logements-epci-departement.csv': checksumOf(epciDepartementsCsv),
        'logements-departement.csv': checksumOf(departementsCsv),
      },
      ...summary,
    }),
  )
}

// Source : Node.js, process.argv : les deux premiers éléments sont l'exécutable et le script
const ARGUMENTS_START = 2

const [command, zipPath] = process.argv.slice(ARGUMENTS_START)

if (command === 'extract' && zipPath !== undefined) await extract(zipPath)
else build()
