import {
  combineResults,
  failure,
  Result,
  success,
} from '@tet/backend/utils/result.type';
import { PersonneId } from '@tet/domain/collectivites';
import { ImportPlanInput } from '../import-plan.input';
import { ParsedRow } from '../parsers/excel-parser';
import { parseImportedAction } from '../schemas/import-action.input';

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
      actions: [],
      pilotes,
      referents,
    };

    const actions = await Promise.all(
      rows.map((row) => parseImportedAction(row))
    );

    const actionsResult = combineResults(actions);
    if (!actionsResult.success) {
      return failure(actionsResult.error);
    }

    return success({
      ...plan,
      actions: actionsResult.data,
    });
  } catch (error) {
    return failure(
      `Error transforming data: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}
