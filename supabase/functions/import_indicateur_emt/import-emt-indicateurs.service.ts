import {
  type AnnualIndicateurPeriod,
  assertAnnualIndicateurDefinition,
  type EmtIndicateurDefinition,
  type IndicateurDefinitionWithPeriodicite,
} from './annual-indicateur-period.adapter.ts';
import { EmtIndicateurData } from './emt-indicateur-data.adapter.ts';
import { InvalidEmtImportError } from './import-emt-indicateurs.error.ts';

export type AnnualEmtValeurInput = Readonly<{
  definition: IndicateurDefinitionWithPeriodicite;
  period: AnnualIndicateurPeriod;
  resultat: number | null;
  commentaire: string | null;
}>;

export type ImportAnnualEmtValeursInput = Readonly<{
  collectiviteId: number;
  valeurs: readonly AnnualEmtValeurInput[];
}>;

/** Persistence contract required by the EMT import use case. */
export interface ImportEmtIndicateursRepository {
  listDefinitions(): Promise<ReadonlyMap<string, EmtIndicateurDefinition>>;
  importAnnualValeurs(input: ImportAnnualEmtValeursInput): Promise<number>;
}

export type EmtWorksheet = Readonly<{
  firstDataRow: number;
  lastDataRowExclusive: number;
  getCellValue: (row: number, column: number) => unknown | null;
}>;

export type ImportEmtIndicateursInput = Readonly<{
  collectiviteId: number;
  referentiel: string;
  worksheet: EmtWorksheet;
}>;

export type ImportEmtIndicateursResult = Readonly<{
  writtenValeursCount: number;
}>;

/** Application orchestration for the annual-only historical EMT import. */
export class ImportEmtIndicateursService {
  constructor(private readonly repository: ImportEmtIndicateursRepository) {}

  async import({
    collectiviteId,
    referentiel,
    worksheet,
  }: ImportEmtIndicateursInput): Promise<ImportEmtIndicateursResult> {
    if (!Number.isInteger(collectiviteId) || collectiviteId < 1) {
      throw new InvalidEmtImportError(
        `Collectivité invalide : ${collectiviteId}`
      );
    }
    if (!referentiel.trim()) {
      throw new InvalidEmtImportError('Le référentiel EMT est obligatoire');
    }

    const definitionsByIdentifiant = await this.repository.listDefinitions();
    const rowsToImport = [];

    // Resolve and validate the complete worksheet before the first write. A
    // monthly January value cannot be distinguished from an annual value by
    // its SQL date alone, so this compatibility boundary fails closed.
    for (
      let row = worksheet.firstDataRow;
      row < worksheet.lastDataRowExclusive;
      row += 1
    ) {
      const definition = EmtIndicateurData.resolveDefinition({
        rawId: worksheet.getCellValue(row, 0),
        rawName: worksheet.getCellValue(row, 2),
        referentiel,
        definitionsByIdentifiant,
      });
      if (definition) {
        assertAnnualIndicateurDefinition(definition);
        rowsToImport.push({ row, definition });
      }
    }

    const valeurs: AnnualEmtValeurInput[] = [];
    for (const { row, definition } of rowsToImport) {
      for (let column = 4; column < 14; column += 3) {
        const period = EmtIndicateurData.parseAnnualPeriod(
          worksheet.getCellValue(row, column + 1)
        );
        const resultat = EmtIndicateurData.normalizeValeur(
          worksheet.getCellValue(row, column),
          definition
        );
        const rawCommentaire = worksheet.getCellValue(row, column + 2);
        const commentaire =
          rawCommentaire === null ? null : String(rawCommentaire);

        if (!period || (resultat === null && !commentaire)) {
          continue;
        }

        valeurs.push({
          definition,
          period,
          resultat,
          commentaire,
        });
      }
    }

    if (valeurs.length === 0) {
      return { writtenValeursCount: 0 };
    }

    // A single repository call is the transaction boundary for the complete
    // workbook. Either every prepared value is persisted, or none is.
    const writtenValeursCount = await this.repository.importAnnualValeurs({
      collectiviteId,
      valeurs,
    });
    return { writtenValeursCount };
  }
}
