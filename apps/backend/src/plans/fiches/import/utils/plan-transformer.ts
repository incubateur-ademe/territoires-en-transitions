import { PlanImport } from '@/backend/plans/fiches/import/import-plan.dto';
import {
  combineResults,
  failure,
  Result,
  success,
} from '@/backend/plans/fiches/import/types/result';
import { ParsedRow } from '@/backend/plans/fiches/import/utils/excel-parser';
import { parseImportedFiche } from '../schemas/import.schema';

export async function transformToPlan(
  rows: ParsedRow[],
  planName: string,
  planType: number | undefined,
  pilotes: { tagId: number | null; userId: string | null }[] | undefined,
  referents: { tagId: number | null; userId: string | null }[] | undefined
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
