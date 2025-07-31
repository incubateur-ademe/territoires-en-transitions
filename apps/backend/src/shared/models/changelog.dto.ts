import { z } from 'zod';

export const changelogSchema = z.object({
  version: z.string().describe('Version du referentiel, ex: 1.0.0'),
  date: z.string().describe('Date de publication de la version'),
  description: z.string().describe('Description des changements de la version'),
});

export type ChangelogType = z.infer<typeof changelogSchema>;
