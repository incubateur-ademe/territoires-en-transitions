import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { Result, err, ok } from 'neverthrow'
import { z } from 'zod'
import { levels } from '../../domain/territory.ts'
import { violation, type Violation } from './violation.ts'

const sourceEntrySchema = z.strictObject({
  file: z.string(),
  source: z.string(),
  link: z.string().optional(),
  retrievedOn: z.string(),
  checksum: z.string().regex(/^[0-9a-f]{64}$/),
})

const datasetEntrySchema = z.strictObject({
  file: z.string(),
  source: z.string(),
  link: z.string(),
  vintage: z.string(),
  retrievedOn: z.string(),
  checksum: z.string().regex(/^[0-9a-f]{64}$/),
  level: z.enum(levels).optional(),
  keyColumn: z.string(),
  columns: z.array(z.object({ name: z.string(), unit: z.string() })),
  controlTotals: z.record(z.string(), z.string()).optional(),
  sources: z.array(sourceEntrySchema).optional(),
})

const manifestSchema = z.object({ datasets: z.array(datasetEntrySchema) })

type DatasetEntry = z.infer<typeof datasetEntrySchema>

const readText = Result.fromThrowable(
  (path: string): string => readFileSync(path, 'utf8'),
  (error): Violation =>
    violation(/ENOENT|ENOTDIR/.test(String(error)) ? 'unknown_dataset' : 'unreadable', String(error)),
)

const parseJson = Result.fromThrowable(
  (text: string): unknown => JSON.parse(text),
  (error): Violation => violation('invalid_manifest', String(error)),
)

function findDatasetEntry({
  rootDirectory,
  folder,
  file,
}: {
  rootDirectory: string
  folder: string
  file: string
}): Result<DatasetEntry, Violation> {
  return readText(join(rootDirectory, folder, 'manifest.json'))
    .andThen(parseJson)
    .andThen((json) => {
      const parsed = manifestSchema.safeParse(json)
      return parsed.success
        ? ok(parsed.data)
        : err(violation('invalid_manifest', parsed.error.message))
    })
    .andThen((manifest) => {
      const entry = manifest.datasets.find((candidate) => candidate.file === file)
      return entry === undefined ? err(violation('unknown_dataset', file)) : ok(entry)
    })
}

export { findDatasetEntry }
export type { DatasetEntry }
