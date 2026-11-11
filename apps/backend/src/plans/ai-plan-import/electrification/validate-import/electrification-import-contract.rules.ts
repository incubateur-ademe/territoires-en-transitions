import { failure, Result, success } from '@tet/backend/utils/result.type';
import { z } from 'zod';
import { AiPlanImportError } from '../../ai-plan-import.errors';
import { AiPlanImportProfileEnum } from '../../models/import-profile';
import { electrificationDocumentTemplate } from '@tet/backend/plans/plans/electrification/config/electrification-document-template.constants';
import {
  ELECTRIFICATION_CHECKPOINT_VERSION,
  ElectrificationExtractionCheckpoint,
  electrificationExtractionCheckpointSchema,
} from '../extract-plan/electrification-extraction-checkpoint.schema';

const electrificationImportContractSchema = z.object({
  profile: z.literal(AiPlanImportProfileEnum.ELECTRIFICATION),
  schemaVersion: z.literal(ELECTRIFICATION_CHECKPOINT_VERSION),
  catalogueVersion: z.string().min(1),
  templateVersion: z.literal(electrificationDocumentTemplate.version),
  contractVersion: z.never().optional(),
});

/** Le checkpoint utilise exactement le contrat et la révision admis pour ce job. */
export class ElectrificationImportContractRules {
  static isSupportedImport(options: unknown): boolean {
    return this.getSupportedContract(options) !== null;
  }

  static parseCheckpoint(
    checkpoint: unknown,
    options: unknown
  ): Result<ElectrificationExtractionCheckpoint, AiPlanImportError> {
    const contract = this.getSupportedContract(options);
    const parsed =
      electrificationExtractionCheckpointSchema.safeParse(checkpoint);
    if (
      !contract ||
      !parsed.success ||
      parsed.data.catalogueVersion !== contract.catalogueVersion ||
      parsed.data.schemaVersion !== contract.schemaVersion ||
      parsed.data.templateVersion !== contract.templateVersion
    ) {
      return failure('INVALID_CHECKPOINT');
    }
    return success(parsed.data);
  }

  private static getSupportedContract(options: unknown) {
    const contract = electrificationImportContractSchema.safeParse(options);
    return contract.success ? contract.data : null;
  }
}
