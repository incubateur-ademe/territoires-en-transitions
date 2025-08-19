import { getErrorMessage } from '@/backend/utils/nest/errors.utils';
import { Injectable, Logger } from '@nestjs/common';
import { Options, parse, Parser } from 'csv-parse';
import { z } from 'zod';

export interface CsvServiceOptions {
  parseOptions?: Options;
  schema?: z.ZodSchema<any>;
}

export interface CsvParseResult<T> {
  data: T[];
  processed: number;
  errors: string[];
}

@Injectable()
export class CsvService {
  private readonly logger = new Logger(CsvService.name);

  /**
   * Parse CSV content and return structured data
   * @param content The CSV content as a string
   * @param options Configuration options for parsing
   * @returns Promise with parsed data, processing stats, and errors
   */
  async getDataFromCsvContent<T>(
    content: string,
    options: CsvServiceOptions = {}
  ): Promise<CsvParseResult<T>> {
    const {
      parseOptions = {
        delimiter: ';',
        columns: true,
        skip_empty_lines: true,
      },
      schema,
    } = options;

    const result: CsvParseResult<T> = {
      data: [],
      processed: 0,
      errors: [],
    };

    return new Promise((resolve, reject) => {
      const parser: Parser = parse(content, parseOptions);

      parser.on('data', async (row: any) => {
        try {
          result.processed++;

          let parsedRow: T;

          // Apply schema validation if provided
          if (schema) {
            parsedRow = schema.parse(row);
          } else {
            parsedRow = row as T;
          }

          // Add to data array
          result.data.push(parsedRow);
        } catch (error) {
          const errorMessage = `Error processing row ${result.processed}: ${
            error instanceof Error ? error.message : 'Unknown error'
          }`;
          result.errors.push(errorMessage);
          this.logger.error(errorMessage);
        }
      });

      parser.on('end', () => {
        this.logger.log(
          `CSV parsing completed: ${result.data.length} rows processed, ${result.errors.length} errors`
        );
        resolve(result);
      });

      parser.on('error', (error) => {
        this.logger.error(`CSV parsing error: ${getErrorMessage(error)}`);
        reject(error);
      });
    });
  }

  /**
   * Parse CSV content and return only the data array (simplified version)
   * @param content The CSV content as a string
   * @param options Configuration options for parsing
   * @returns Promise with parsed data array
   */
  async parseCsvContent<T>(
    content: string,
    options: CsvServiceOptions = {}
  ): Promise<T[]> {
    const result = await this.getDataFromCsvContent<T>(content, options);
    return result.data;
  }
}
