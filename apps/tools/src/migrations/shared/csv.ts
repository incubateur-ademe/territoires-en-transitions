import { parse } from 'csv-parse/sync';
import * as fs from 'fs';

type CsvDelimiter = ',' | '\t' | ';';

type ParseCsvOptions = {
  delimiter?: CsvDelimiter;
  bom?: boolean;
  quote?: string;
};

/** Parse CSV as array of arrays (default: tab-separated) */
export const parseCsvRows = (
  content: string,
  options?: ParseCsvOptions
): string[][] =>
  parse(content, {
    delimiter: options?.delimiter ?? '\t',
    skip_empty_lines: true,
    trim: true,
    relax_column_count: true,
    bom: options?.bom ?? false,
    quote: options?.quote ?? '"',
  }) as string[][];

/** Parse CSV as array of records using header row as keys (default: comma-separated) */
export const parseCsvRecords = (
  content: string,
  options?: ParseCsvOptions
): Record<string, string>[] =>
  parse(content, {
    columns: true,
    delimiter: options?.delimiter ?? ',',
    skip_empty_lines: true,
    trim: true,
    relax_column_count: true,
    bom: options?.bom ?? false,
    quote: options?.quote ?? '"',
  }) as Record<string, string>[];

export const readCsvFile = (path: string): string =>
  fs.readFileSync(path, 'utf-8');

export const getCsvPathFromArgv = (
  argvIndex: number,
  usage: string
): string => {
  const csvPath = process.argv[argvIndex];
  if (!csvPath || !fs.existsSync(csvPath)) {
    throw new Error(`CSV file not found: ${csvPath}\nUsage: ${usage}`);
  }
  return csvPath;
};
