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
  }, z.array(z.string()))
  .default([]);

export const enqueueImportFormSchema = z.object({
  instructions: z.string().default(''),
  withVerifications: booleanFromString,
  withSousActions: booleanFromString,
  disabledFields: stringArrayFromJson,
});

export const parseEnqueueImportForm = (
  body: unknown
): AiPlanImportJobOptions => enqueueImportFormSchema.parse(body);

const safeParseJsonArray = (value: string): string[] => {
  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
};
