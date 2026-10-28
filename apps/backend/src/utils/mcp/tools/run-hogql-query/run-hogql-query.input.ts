import { z } from 'zod';
import { MCP_MAX_SQL_LENGTH } from '../../mcp.constants';

export const runHogqlQueryInputSchema = z.object({
  hogql: z
    .string()
    .min(1)
    .max(MCP_MAX_SQL_LENGTH)
    .describe(
      'Requête HogQL (SELECT ... FROM events ...) avec un LIMIT explicite. Avec les marqueurs {start} et {end}, elle est exécutée mois par mois entre dateFrom et dateTo.'
    ),
  dateFrom: z
    .string()
    .optional()
    .describe(
      'Début de période (ISO, ex. 2025-01-01), obligatoire si la requête contient {start}/{end}.'
    ),
  dateTo: z
    .string()
    .optional()
    .describe('Fin de période (ISO) ; absente = maintenant.'),
});

export type RunHogqlQueryInput = z.infer<typeof runHogqlQueryInputSchema>;
