import { join } from 'node:path'
import { Result, ResultAsync } from 'neverthrow'
import { readSheet } from 'read-excel-file/node'
import {
  invalidDataset,
  type DataRow,
  type DataSourceError,
  type InvalidDataset,
} from '../../domain/data-source.ts'
import { createCsvDataSource } from '../../infrastructure/csv/csv-data-source.ts'
import { findDatasetEntry, type DatasetEntry } from '../../infrastructure/csv/manifest.ts'
import {
  readManifestSourceBytes,
  readManifestSourceText,
  type ManifestSourceReference,
} from '../../infrastructure/csv/read-manifest-source.ts'
import { toInvalidDataset } from '../../infrastructure/csv/violation.ts'
import type { AgriculturalEnergySources, NamedSheet } from './build-agricultural-energy.ts'

type SourceReference = Omit<ManifestSourceReference, 'folderPath' | 'dataset'> & {
  readonly dataDirectory: string
}

type RegionalSheets = {
  readonly regionalSheets: readonly NamedSheet[]
  readonly nationalSheet: NamedSheet
}

type LocalInputs = Omit<AgriculturalEnergySources, keyof RegionalSheets>

const datasetFolder = 'batiments-machines-agricoles'
const nationalWorkbookFile = 'sources/sdes-energie-france-metropolitaine.xlsx'
const irisElectricityFile = 'sources/sdes-electricite-iris-2024-agriculture.csv'
const irisGasFile = 'sources/sdes-gaz-iris-2024-agriculture.csv'
const epciElectricityFile = 'sources/sdes-electricite-epci-2024-agriculture.csv'
const epciGasFile = 'sources/sdes-gaz-epci-2024-agriculture.csv'

function toDatasetName(file: string): string {
  return `${datasetFolder}/${file}`
}

function toManifestSource({
  dataDirectory,
  entry,
  file,
}: SourceReference): ManifestSourceReference {
  return {
    folderPath: join(dataDirectory, datasetFolder),
    entry,
    file,
    dataset: toDatasetName(entry.file),
  }
}

function findEntry({
  dataDirectory,
  file,
}: {
  dataDirectory: string
  file: string
}): Result<DatasetEntry, InvalidDataset> {
  return findDatasetEntry({ rootDirectory: dataDirectory, folder: datasetFolder, file }).mapErr(
    toInvalidDataset(toDatasetName(file)),
  )
}

function readSheetSource(reference: SourceReference): ResultAsync<NamedSheet, InvalidDataset> {
  const manifestSource = toManifestSource(reference)
  return readManifestSourceBytes(manifestSource)
    .asyncAndThen((bytes) =>
      ResultAsync.fromPromise(
        readSheet(bytes, { parseNumber: (text: string) => text }),
        (error) =>
          invalidDataset({
            dataset: manifestSource.dataset,
            reason: 'unreadable',
            detail: `${manifestSource.file}: ${String(error)}`,
          }),
      ),
    )
    .map((rows) => ({ name: manifestSource.file, rows }))
}

function readRegionalSheets({
  dataDirectory,
  entry,
}: Omit<SourceReference, 'file'>): ResultAsync<RegionalSheets, InvalidDataset> {
  const regionalFiles = (entry.sources ?? [])
    .map(({ file }) => file)
    .filter((file) => file !== nationalWorkbookFile)
  return ResultAsync.combine(
    regionalFiles.map((file) => readSheetSource({ dataDirectory, entry, file })),
  ).andThen((regionalSheets) =>
    readSheetSource({ dataDirectory, entry, file: nationalWorkbookFile }).map((nationalSheet) => ({
      regionalSheets,
      nationalSheet,
    })),
  )
}

function readCommunes(dataDirectory: string): Result<readonly DataRow[], DataSourceError> {
  return createCsvDataSource(dataDirectory).rows('territoires/communes')
}

function readLocalInputs({
  dataDirectory,
  departements,
  epcis,
}: {
  dataDirectory: string
  departements: DatasetEntry
  epcis: DatasetEntry
}): Result<LocalInputs, DataSourceError> {
  const readText = (entry: DatasetEntry, file: string): Result<string, InvalidDataset> =>
    readManifestSourceText(toManifestSource({ dataDirectory, entry, file }))
  return Result.combine([
    readText(departements, irisElectricityFile),
    readText(departements, irisGasFile),
    readText(epcis, epciElectricityFile),
    readText(epcis, epciGasFile),
  ]).andThen(([irisElectricityCsv, irisGasCsv, epciElectricityCsv, epciGasCsv]) =>
    readCommunes(dataDirectory).map((communes) => ({
      communes,
      irisElectricityCsv,
      irisGasCsv,
      epciElectricityCsv,
      epciGasCsv,
    })),
  )
}

function readAgriculturalEnergySources(
  dataDirectory: string,
): ResultAsync<AgriculturalEnergySources, DataSourceError> {
  return Result.combine([
    findEntry({ dataDirectory, file: 'regions.csv' }),
    findEntry({ dataDirectory, file: 'departements.csv' }),
    findEntry({ dataDirectory, file: 'epcis.csv' }),
  ]).asyncAndThen(([regions, departements, epcis]) =>
    readRegionalSheets({ dataDirectory, entry: regions }).andThen((sheets) =>
      readLocalInputs({ dataDirectory, departements, epcis }).map((local) => ({
        ...sheets,
        ...local,
      })),
    ),
  )
}

export { readAgriculturalEnergySources }
