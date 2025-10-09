import { PlanImport } from '@/backend/plans/fiches/import/import-plan.dto';
import {
  failure,
  Result,
  success,
} from '@/backend/plans/fiches/import/types/result';
import { ParsedRow } from '@/backend/plans/fiches/import/utils/excel-parser';
import { parseImportData } from '../schemas/import.schema';

/**
 * Transform parsed Excel data into a plan structure
 */
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
      enfants: new Set(),
      fiches: [],
      pilotes,
      referents,
    };

    // Process each row
    for (const row of rows) {
      try {
        // Parse and validate row data
        const parsedData = await parseImportData(row);

        // Create fiche from validated data
        plan.fiches.push(parsedData);
      } catch (error) {
        return failure(
          `Error processing row: ${
            error instanceof Error ? error.message : String(error)
          }`
        );
      }
    }

    return success(plan);
  } catch (error) {
    return failure(
      `Error transforming data: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}
