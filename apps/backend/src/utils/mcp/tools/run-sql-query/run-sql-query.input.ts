import { z } from 'zod';
import { MCP_MAX_SQL_LENGTH } from '../../mcp.constants';

export const runSqlQueryInputSchema = z.object({
  sql: z
    .string()
    .min(1)
    .max(MCP_MAX_SQL_LENGTH)
    .describe(
      'Requête SQL SELECT (ou WITH ... SELECT) PostgreSQL, une seule instruction, tables préfixées de leur schéma (prod. ou public.).'
    ),
});

export type RunSqlQueryInput = z.infer<typeof runSqlQueryInputSchema>;
