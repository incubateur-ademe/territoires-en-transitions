import { getPropertyPaths } from '@tet/backend/utils/zod.utils';
import { getErrorMessage } from '@tet/domain/utils';
import { parse } from 'csv-parse/sync';
import { isNil } from 'es-toolkit';
import * as fs from 'fs';
import z from 'zod';
import * as zCore from 'zod/v4/core';

export const stringFrenchNumberSchema = z.union([
  z.number(),
  z
    .string()
    .transform((val) => (isNil(val) ? undefined : val.replace(',', '.')))
    .pipe(z.coerce.number()),
]);

/**
 * Parses a CSV file into the same format as SheetService.getDataFromSheet:
 * applies the Zod schema for validation and type coercion, merges template data.
 */
export function parseCsvWithSchema<T extends Record<string, unknown>>(
  csvPath: string,
  schema: zCore.$ZodObject,
  templateData?: Partial<T>
): { data: T[]; header: string[] } {
  const csvContent = fs.readFileSync(csvPath, 'utf-8');
  const records: Record<string, string>[] = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    relax_column_count: true,
  });

  const header = Object.keys(records[0] ?? {});
  const expectedHeader = getPropertyPaths(schema);
  const data: T[] = records
    .map((record) => {
      const dataRecord: any = { ...templateData };
      // Lower case csv keys and ignore empty values
      for (const [key, value] of Object.entries(record)) {
        const fieldName = expectedHeader.find(
          (h) => h.toLowerCase() === key.trim().toLowerCase()
        );
        if (fieldName && !isNil(value) && value !== '') {
          dataRecord[fieldName] = value;
        }
      }

      if (Object.keys(dataRecord).length === 0) return null;
      try {
        return zCore.parse(schema, dataRecord) as T;
      } catch (e) {
        console.warn(
          `[parseCsvWithSchema] Invalid record in ${csvPath}: ${getErrorMessage(
            e
          )}`,
          dataRecord
        );
        throw e;
      }
    })
    .filter((r): r is T => r !== null);

  return { data, header };
}
