import { GristDocumentRules } from './grist-document.rules';
import { Injectable } from '@nestjs/common';
import { z } from 'zod';
import ConfigurationService from '../config/configuration.service';
import { failure, Result, success } from '../result.type';

const recordsSchema = z.object({
  records: z.array(
    z.object({ id: z.number().int().positive(), fields: z.unknown() })
  ),
});
const statesSchema = z.object({
  states: z.array(z.object({ h: z.string().min(1) })).min(1),
});
const columnsSchema = z.object({
  columns: z.array(
    z.object({ id: z.string(), fields: z.object({ label: z.string() }) })
  ),
});
type GristTable = string | { id: string; columnLabels: readonly string[] };
type GristSnapshot = {
  revision: string;
  tables: Record<string, z.output<typeof recordsSchema>['records']>;
};
type ReadGristError =
  | 'SOURCE_UNAVAILABLE'
  | 'SOURCE_CHANGED'
  | 'INVALID_SOURCE';

/** Lecture d'un document cohérent, sans modification de Grist. */
@Injectable()
export class ReadGristService {
  constructor(private readonly config: ConfigurationService) {}

  async read(
    documentId: string,
    tables: readonly GristTable[]
  ): Promise<Result<GristSnapshot, ReadGristError>> {
    try {
      const revision = await this.revision(documentId);
      const entries = await Promise.all(
        tables.map(async (table) => {
          const tableId = typeof table === 'string' ? table : table.id;
          const records = await this.readTable(documentId, table);
          if (new Set(records.map(({ id }) => id)).size !== records.length) {
            throw new Error('Duplicate Grist row identifiers');
          }
          return [tableId, records] as const;
        })
      );
      if (revision !== (await this.revision(documentId)))
        return failure('SOURCE_CHANGED');
      return success({ revision, tables: Object.fromEntries(entries) });
    } catch (error) {
      // Ne pas journaliser les réponses Grist : l'annuaire contient des données privées.
      return failure(
        error instanceof z.ZodError ? 'INVALID_SOURCE' : 'SOURCE_UNAVAILABLE'
      );
    }
  }

  private async readTable(documentId: string, table: GristTable) {
    const tableId = typeof table === 'string' ? table : table.id;
    const path = `/tables/${encodeURIComponent(tableId)}`;
    const { records } = recordsSchema.parse(
      await this.get(documentId, `${path}/records`)
    );
    if (typeof table === 'string') return records;

    // Les exports métier donnent les libellés, pas nécessairement les IDs techniques.
    const { columns } = columnsSchema
      .refine(({ columns }) =>
        table.columnLabels.every(
          (label) =>
            columns.filter(({ fields }) => fields.label === label).length === 1
        )
      )
      .parse(await this.get(documentId, `${path}/columns`));
    const selected = columns.filter(({ fields }) =>
      table.columnLabels.includes(fields.label)
    );
    return records.map(({ id, fields }) => {
      const values = z.record(z.string(), z.unknown()).parse(fields);
      return {
        id,
        fields: Object.fromEntries(
          selected.map((column) => [column.fields.label, values[column.id]])
        ),
      };
    });
  }

  private async revision(documentId: string) {
    return statesSchema.parse(await this.get(documentId, '/states')).states[0]
      .h;
  }

  private async get(documentId: string, path: string): Promise<unknown> {
    const token = this.config.get('GRIST_API_KEY');
    const response = await fetch(
      `${GristDocumentRules.getApiUrl(documentId)}${path}`,
      {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        redirect: 'error',
        signal: AbortSignal.timeout(15_000),
      }
    );
    if (!response.ok) throw new Error(`Grist HTTP ${response.status}`);
    return response.json();
  }
}
