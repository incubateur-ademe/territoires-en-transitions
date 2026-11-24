import { writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { buildLeverLimitsSource } from './build-lever-limits-source.ts'
import { readMethodologies } from './read-methodologies.ts'

const target = join(import.meta.dirname, '..', '..', 'domain', 'lever-limits.ts')

writeFileSync(target, buildLeverLimitsSource(readMethodologies()))
