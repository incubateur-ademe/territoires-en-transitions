import { join } from 'node:path'
import { Result, ResultAsync } from 'neverthrow'
import { readSheet } from 'read-excel-file/node'
import { invalidDataset, type InvalidDataset } from '../../domain/data-source.ts'
import { findDatasetEntry, type DatasetEntry } from '../../infrastructure/csv/manifest.ts'
import {
  readManifestSourceBytes,
  readManifestSourceText,
} from '../../infrastructure/csv/read-manifest-source.ts'
import { toInvalidDataset } from '../../infrastructure/csv/violation.ts'
import type { SheetRows } from '../sheet-rows.ts'
import type { ResidentialEnergySources } from './build-residential-energy.ts'

const datasetFolder = 'residentiel-sobriete'
const regionalBilanFile = 'sources/sdes-bilan-energie-residentiel-2024.csv'
const cerenFile = 'sources/ceren-donnees-energie-residentiel-1990-2024.xlsx'
const irisElectricityFile = 'sources/sdes-electricite-iris-2024-residentiel-par-departement.csv'
const irisGasFile = 'sources/sdes-gaz-iris-2024-residentiel-par-departement.csv'
const oilSalesFile = 'sources/sdes-ventes-produits-petroliers-departement.csv'
const heatFile = 'sources/sdes-chaleur-commune-2024.csv'

function toDatasetName(file: string): string {
  return `${datasetFolder}/${file}`
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

function readText({
  dataDirectory,
  entry,
  file,
}: {
  dataDirectory: string
  entry: DatasetEntry
  file: string
}): Result<string, InvalidDataset> {
  return readManifestSourceText({
    folderPath: join(dataDirectory, datasetFolder),
    entry,
    file,
    dataset: toDatasetName(file),
  })
}

function readCerenSheet({
  dataDirectory,
  entry,
}: {
  dataDirectory: string
  entry: DatasetEntry
}): ResultAsync<SheetRows, InvalidDataset> {
  const dataset = toDatasetName(cerenFile)
  return readManifestSourceBytes({
    folderPath: join(dataDirectory, datasetFolder),
    entry,
    file: cerenFile,
    dataset,
  }).asyncAndThen((bytes) =>
    ResultAsync.fromPromise(readSheet(bytes, { parseNumber: (text: string) => text }), (error) =>
      invalidDataset({ dataset, reason: 'unreadable', detail: `${cerenFile}: ${String(error)}` }),
    ),
  )
}

function readResidentialEnergySources(
  dataDirectory: string,
): ResultAsync<ResidentialEnergySources, InvalidDataset> {
  const regionsEntry = findEntry({ dataDirectory, file: 'regions.csv' })
  const departementsEntry = findEntry({ dataDirectory, file: 'departements.csv' })
  const heatNetworksEntry = findEntry({ dataDirectory, file: 'heat-networks.csv' })
  return Result.combine([regionsEntry, departementsEntry, heatNetworksEntry]).asyncAndThen(
    ([regions, departements, heatNetworks]) => {
      const regionalBilanText = readText({
        dataDirectory,
        entry: regions,
        file: regionalBilanFile,
      })
      const irisElectricityText = readText({
        dataDirectory,
        entry: departements,
        file: irisElectricityFile,
      })
      const irisGasText = readText({ dataDirectory, entry: departements, file: irisGasFile })
      const oilSalesText = readText({ dataDirectory, entry: departements, file: oilSalesFile })
      const heatText = readText({ dataDirectory, entry: heatNetworks, file: heatFile })
      return Result.combine([
        regionalBilanText,
        irisElectricityText,
        irisGasText,
        oilSalesText,
        heatText,
      ]).asyncAndThen(([regionalBilanCsv, irisElectricityCsv, irisGasCsv, oilSalesCsv, heatCsv]) =>
        readCerenSheet({ dataDirectory, entry: regions }).map((cerenRows) => ({
          regionalBilanCsv,
          cerenRows,
          irisElectricityCsv,
          irisGasCsv,
          oilSalesCsv,
          heatCsv,
        })),
      )
    },
  )
}

export { readResidentialEnergySources }
