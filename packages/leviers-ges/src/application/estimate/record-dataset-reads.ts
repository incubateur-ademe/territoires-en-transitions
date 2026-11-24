import type { DataSource } from '../../domain/data-source.ts'

type DatasetReadRecorder = {
  readonly dataSource: DataSource
  readonly takeReadDatasets: () => readonly string[]
}

function recordDatasetReads(dataSource: DataSource): DatasetReadRecorder {
  const readDatasets = new Set<string>()
  return {
    dataSource: {
      provenance: (dataset) => dataSource.provenance(dataset),
      constant: (dataset, name) => {
        readDatasets.add(dataset)
        return dataSource.constant(dataset, name)
      },
      row: (dataset, territory) => {
        readDatasets.add(dataset)
        return dataSource.row(dataset, territory)
      },
      rows: (dataset) => {
        readDatasets.add(dataset)
        return dataSource.rows(dataset)
      },
    },
    takeReadDatasets: () => {
      const taken = [...readDatasets]
      readDatasets.clear()
      return taken
    },
  }
}

export { recordDatasetReads }
export type { DatasetReadRecorder }
