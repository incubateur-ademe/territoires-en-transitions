import { AiPlanImportJobStatus } from '../models/ai-plan-import-job';
import { LineValidationError } from './draft-to-import-plan-input';

export type ConfirmError =
  | { kind: 'job_not_found' }
  | { kind: 'forbidden' }
  | { kind: 'not_confirmable'; status: AiPlanImportJobStatus }
  | { kind: 'no_draft' }
  | { kind: 'invalid_lines'; errors: LineValidationError[] }
  | { kind: 'persistence_failed'; message: string; isClient: boolean };
