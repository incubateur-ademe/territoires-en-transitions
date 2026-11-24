import { writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { buildGoodsTransport } from './build-goods-transport.ts'
import { readGoodsTransportSources } from './read-goods-transport-sources.ts'

const dataDirectory = join(import.meta.dirname, '..', '..', '..', 'data')

const goodsBuild = readGoodsTransportSources(dataDirectory).andThen(buildGoodsTransport)

if (goodsBuild.isErr()) {
  console.error(JSON.stringify(goodsBuild.error))
  process.exitCode = 1
} else {
  const { csv, regionCount, totals } = goodsBuild.value
  writeFileSync(join(dataDirectory, 'transport-marchandises', 'regions.csv'), csv)
  console.log(JSON.stringify({ regions: regionCount, totals }))
}
