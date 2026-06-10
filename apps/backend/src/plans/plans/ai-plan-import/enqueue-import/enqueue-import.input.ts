import { z } from 'zod';
import { AiPlanImportJobOptions } from '../models/ai-plan-import-job.table';

const booleanFromString = z
  .enum(['true', 'false'])
  .default('true')
  .transform((value) => value === 'true');

const stringArrayFromJson = z
  .preprocess(
    (value) =>
      typeof value === 'string' && value.trim().length > 0
        ? parseJsonArrayOrEmpty(value)
        : [],
    z.array(z.string().max(100)).max(50)
  )
  .default([]);

const enqueueImportFormSchema = z.object({
  instructions: z.string().max(2000).default(''),
  withVerifications: booleanFromString,
  withSousActions: booleanFromString,
  disabledFields: stringArrayFromJson,
});

export const tryParseEnqueueImportForm = (
  body: unknown
): AiPlanImportJobOptions | null => {
  const parsed = enqueueImportFormSchema.safeParse(body);
  return parsed.success ? parsed.data : null;
};

const parseJsonArrayOrEmpty = (value: string): unknown => {
  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};
