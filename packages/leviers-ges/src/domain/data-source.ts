import type { Result } from 'neverthrow'
import type { Level, Territory } from './territory.ts'

type DataRow = Readonly<Record<string, string>>

type MissingData = {
  readonly kind: 'missing_data'
  readonly dataset: string
  readonly key: string
}

type InvalidDatasetReason =
  | 'unknown_dataset'
  | 'invalid_manifest'
  | 'unreadable'
  | 'malformed_csv'
  | 'checksum_mismatch'
  | 'not_utf8'
  | 'empty_dataset'
  | 'columns_mismatch'
  | 'control_total_mismatch'
  | 'excess_precision'
  | 'scientific_notation'
  | 'decimal_comma'
  | 'missing_key_column'
  | 'empty_key'
  | 'duplicate_key'
  | 'level_mismatch'

type InvalidDataset = {
  readonly kind: 'invalid_dataset'
  readonly dataset: string
  readonly reason: InvalidDatasetReason
  readonly detail: string
}

type DataSourceError = MissingData | InvalidDataset

type DatasetProvenance = {
  readonly dataset: string
  readonly source: string
  readonly vintage: string
  readonly retrievedOn: string
}

interface DataSource {
  provenance(dataset: string): Result<DatasetProvenance, DataSourceError>
  constant(dataset: string, name: string): Result<string, DataSourceError>
  row(dataset: string, territory: Territory<Level>): Result<DataRow, DataSourceError>
  rows(dataset: string): Result<readonly DataRow[], DataSourceError>
}

function missingData({ dataset, key }: Pick<MissingData, 'dataset' | 'key'>): MissingData {
  return { kind: 'missing_data', dataset, key }
}

function invalidDataset({
  dataset,
  reason,
  detail,
}: Pick<InvalidDataset, 'dataset' | 'reason' | 'detail'>): InvalidDataset {
  return { kind: 'invalid_dataset', dataset, reason, detail }
}

export { invalidDataset, missingData }
export type { DataRow, DataSource, DatasetProvenance, DataSourceError, InvalidDataset, InvalidDatasetReason, MissingData }
