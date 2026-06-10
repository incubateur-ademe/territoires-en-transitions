import { Logger } from '@nestjs/common';
import SupabaseService from '@tet/backend/utils/database/supabase.service';
import { getErrorMessage } from '@tet/domain/utils';
import { AI_PLAN_IMPORT_SOURCE_BUCKET } from './ai-plan-import.constants';

const logger = new Logger('AiPlanImportRemoveSourceObject');

export const removeSourceObject = async (
  supabase: SupabaseService,
  sourcePath: string
): Promise<void> => {
  const { error } = await supabase.client.storage
    .from(AI_PLAN_IMPORT_SOURCE_BUCKET)
    .remove([sourcePath]);
  if (error) {
    logger.error(
      `Suppression source ${sourcePath}: ${getErrorMessage(error)}`
    );
  }
};
