import {
  combineResults,
  failure,
  Result,
  success,
} from '@tet/backend/utils/result.type';
import { PersonneId } from '@tet/domain/collectivites';
import { ImportPlanInput } from '../import-plan.input';
import { ParsedRow } from '../parsers/excel-parser';
import { parseImportedFiche } from '../schemas/import-fiche.input';

export async function createImportPlanInput(
  rows: ParsedRow[],
  planName: string,
  planType: number | undefined,
  pilotes: PersonneId[] | undefined,
  referents: PersonneId[] | undefined
): Promise<Result<ImportPlanInput, string>> {
  try {
    const plan: ImportPlanInput = {
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
