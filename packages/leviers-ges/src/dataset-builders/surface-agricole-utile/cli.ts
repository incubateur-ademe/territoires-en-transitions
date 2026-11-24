import { createHash } from 'node:crypto'
import { writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { buildAgriculturalArea } from './build-agricultural-area.ts'
import { readAgriculturalAreaSources } from './read-agricultural-area-sources.ts'

const dataDirectory = join(import.meta.dirname, '..', '..', '..', 'data')

const agriculturalArea = readAgriculturalAreaSources(dataDirectory).andThen(buildAgriculturalArea)

if (agriculturalArea.isErr()) {
  console.error(JSON.stringify(agriculturalArea.error))
  process.exitCode = 1
} else {
  const { csv, communeCount, recodedCommuneCount, totalHectares } = agriculturalArea.value
  writeFileSync(join(dataDirectory, 'surface-agricole-utile', 'communes.csv'), csv)
  console.log(
    JSON.stringify({
      file: 'communes.csv',
      checksum: createHash('sha256').update(csv).digest('hex'),
      communes: communeCount,
      recodedCommunes: recodedCommuneCount,
      controlTotals: { agricultural_area_ha: totalHectares },
    }),
  )
}
