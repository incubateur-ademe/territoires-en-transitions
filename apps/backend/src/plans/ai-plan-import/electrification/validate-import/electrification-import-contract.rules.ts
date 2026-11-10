import { failure, Result, success } from '@tet/backend/utils/result.type';
import { electrificationConfigSchema } from '@tet/domain/plans';
import { z } from 'zod';
import { AiPlanImportError } from '../../ai-plan-import.errors';
import { AiPlanImportProfileEnum } from '../../models/import-profile';
import { electrificationDocumentTemplate } from '../extract-plan/electrification-document-template.constants';
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

/** Un job et son checkpoint doivent rester compatibles avec le catalogue livré. */
export class ElectrificationImportContractRules {
  static isSupportedImport(options: unknown, catalogue: unknown): boolean {
    return this.getSupportedContract(options, catalogue) !== null;
  }

  static parseCheckpoint(
    checkpoint: unknown,
    options: unknown,
    catalogue: unknown
  ): Result<ElectrificationExtractionCheckpoint, AiPlanImportError> {
    const contract = this.getSupportedContract(options, catalogue);
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

  private static getSupportedContract(options: unknown, catalogue: unknown) {
    const contract = electrificationImportContractSchema.safeParse(options);
    const config = electrificationConfigSchema.safeParse(catalogue);
    return contract.success &&
      config.success &&
      contract.data.catalogueVersion === config.data.version
      ? contract.data
      : null;
  }
}
