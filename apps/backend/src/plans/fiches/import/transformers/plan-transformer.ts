import { PlanImport } from '@tet/backend/plans/fiches/import/import-plan.dto';
import { ParsedRow } from '@tet/backend/plans/fiches/import/parsers/excel-parser';
import {
  combineResults,
  failure,
  Result,
  success,
} from '@tet/backend/shared/types/result';
import { PersonneId } from '@tet/domain/collectivites';
import { parseImportedFiche } from '../schemas/fiche-import.schema';

export async function transformToPlan(
  rows: ParsedRow[],
  planName: string,
  planType: number | undefined,
  pilotes: PersonneId[] | undefined,
  referents: PersonneId[] | undefined
): Promise<Result<PlanImport, string>> {
  try {
    const plan: PlanImport = {
      nom: planName,
      typeId: planType,
      fiches: [],
      pilotes,
      referents,
    };

    const fiches = await Promise.all(
      rows.map((row) => parseImportedFiche(row))
    );

    const fichesResult = combineResults(fiches);
    if (!fichesResult.success) {
      return failure(fichesResult.error);
    }

    return success({
      ...plan,
      fiches: fichesResult.data,
    });
  } catch (error) {
    return failure(
      `Error transforming data: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}
