import * as z from 'zod/mini';
import {
  defaultUserPreferences,
  userPreferencesSchema,
} from './user-preferences.schema';

export const dcpSchema = z.object({
  id: z.uuid(),
  nom: z.string(),
  prenom: z.string(),
  email: z.string(),
  limited: z.boolean(),
  deleted: z.boolean(),
  createdAt: z.nullable(z.string()),
  modifiedAt: z.nullable(z.string()),
  telephone: z.nullable(z.string()),
  cguAccepteesLe: z.nullable(z.string()),
  preferences: z._default(userPreferencesSchema, defaultUserPreferences),
});

export type Dcp = z.infer<typeof dcpSchema>;
