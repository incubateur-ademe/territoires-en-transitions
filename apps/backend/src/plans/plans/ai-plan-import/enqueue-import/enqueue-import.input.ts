import { z } from 'zod';
import { AiPlanImportJobOptions } from '../models/ai-plan-import-job.table';

const booleanFromString = z
  .preprocess(
    (value) => (typeof value === 'string' ? value.toLowerCase() === 'true' : value),
    z.boolean()
  )
  .default(true);

const stringArrayFromJson = z
  .preprocess((value) => {
    if (Array.isArray(value)) {
      return value;
    }
    if (typeof value === 'string' && value.trim().length > 0) {
      return safeParseJsonArray(value);
    }
    return [];
  }, z.array(z.string().max(100)).max(50))
  .default([]);

export const enqueueImportFormSchema = z.object({
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

const safeParseJsonArray = (value: string): string[] => {
  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
};
