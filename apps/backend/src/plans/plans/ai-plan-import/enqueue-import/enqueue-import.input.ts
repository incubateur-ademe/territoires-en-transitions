import { z } from 'zod';
import { disableableFieldValues } from '../models/disableable-field';

const booleanFromString = z
  .enum(['true', 'false'])
  .default('true')
  .transform((value) => value === 'true');

const disabledFieldsFromForm = z
  .union([
    z.enum(disableableFieldValues).transform((value) => [value]),
    z.array(z.enum(disableableFieldValues)).max(disableableFieldValues.length),
  ])
  .default([]);

export const enqueueImportFormSchema = z.object({
  instructions: z.string().max(2000).default(''),
  withVerifications: booleanFromString,
  withSousActions: booleanFromString,
  disabledFields: disabledFieldsFromForm,
});
