export const demarchePcaetAutosaveKeys = {
  documents: (demarcheId: number) => `demarche-pcaet-documents-${demarcheId}`,
  diagnosticIndicateurTable: (demarcheId: number, tableId: string) =>
    `demarche-pcaet-diagnostic-${demarcheId}-${tableId}`,
  diagnosticVulnerabilite: (demarcheId: number) =>
    `demarche-pcaet-vulnerabilite-${demarcheId}`,
};
