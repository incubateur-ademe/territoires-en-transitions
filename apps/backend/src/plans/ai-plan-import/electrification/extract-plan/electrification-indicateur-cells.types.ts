import type { ElectrificationDocumentSource } from './electrification-extraction.schema';

/** Cellules normalisées, indépendantes de leur position dans le canevas Word. */
export type ElectrificationIndicateurCells = {
  reference: ElectrificationDocumentSource;
  titre: ElectrificationDocumentSource;
  resultat: ElectrificationDocumentSource;
  objectif: ElectrificationDocumentSource;
  objectifComplementaire?: ElectrificationDocumentSource;
};
