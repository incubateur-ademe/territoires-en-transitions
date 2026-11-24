import { join } from 'node:path'
import { err, ok, type Result } from 'neverthrow'
import { invalidDataset, type InvalidDataset } from '../../domain/data-source.ts'
import type { DatasetEntry } from './manifest.ts'
import { readVerifiedBytes, readVerifiedText } from './read-verified-file.ts'

type ManifestSourceReference = {
  readonly folderPath: string
  readonly entry: DatasetEntry
  readonly file: string
  readonly dataset: string
}

function findSourceChecksum({
  entry,
  file,
  dataset,
}: Omit<ManifestSourceReference, 'folderPath'>): Result<string, InvalidDataset> {
  const source = entry.sources?.find((candidate) => candidate.file === file)
  return source === undefined
    ? err(invalidDataset({ dataset, reason: 'invalid_manifest', detail: file }))
    : ok(source.checksum)
}

function toSourceFailure({ dataset, file }: { dataset: string; file: string }) {
  return ({ reason, detail }: { reason: InvalidDataset['reason']; detail: string }): InvalidDataset =>
    invalidDataset({ dataset, reason, detail: `${file}: ${detail}` })
}

function readManifestSourceBytes({
  folderPath,
  entry,
  file,
  dataset,
}: ManifestSourceReference): Result<Buffer, InvalidDataset> {
  return findSourceChecksum({ entry, file, dataset }).andThen((expectedChecksum) =>
    readVerifiedBytes({ path: join(folderPath, file), expectedChecksum }).mapErr(
      toSourceFailure({ dataset, file }),
    ),
  )
}

function readManifestSourceText({
  folderPath,
  entry,
  file,
  dataset,
}: ManifestSourceReference): Result<string, InvalidDataset> {
  return findSourceChecksum({ entry, file, dataset }).andThen((expectedChecksum) =>
    readVerifiedText({ path: join(folderPath, file), expectedChecksum }).mapErr(
      toSourceFailure({ dataset, file }),
    ),
  )
}

export { readManifestSourceBytes, readManifestSourceText }
export type { ManifestSourceReference }
