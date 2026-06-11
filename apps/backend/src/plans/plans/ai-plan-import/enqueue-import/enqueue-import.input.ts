import { z } from 'zod';
import { AiPlanImportJobOptions } from '../models/ai-plan-import-job.table';
import { disableableFieldValues } from '../models/disableable-field';

const booleanFromString = z
  .enum(['true', 'false'])
  .default('true')
  .transform((value) => value === 'true');

const disabledFieldsFromJson = z
  .preprocess(
    (value) =>
      typeof value === 'string' && value.trim().length > 0
        ? parseJsonOrNull(value)
        : [],
    z.array(z.enum(disableableFieldValues)).max(disableableFieldValues.length)
  )
  .default([]);

const enqueueImportFormSchema = z.object({
  instructions: z.string().max(2000).default(''),
  withVerifications: booleanFromString,
  withSousActions: booleanFromString,
  disabledFields: disabledFieldsFromJson,
});

export const tryParseEnqueueImportForm = (
  body: unknown
): AiPlanImportJobOptions | null => {
  const parsed = enqueueImportFormSchema.safeParse(body);
  return parsed.success ? parsed.data : null;
};

const parseJsonOrNull = (value: string): unknown => {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};
