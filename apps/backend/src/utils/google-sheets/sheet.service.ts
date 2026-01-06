import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { Options, default as retry } from 'async-retry';
import { isNil } from 'es-toolkit';
import { set } from 'es-toolkit/compat';
import type { Response } from 'express';
import * as gaxios from 'gaxios';
import * as auth from 'google-auth-library';
import { drive_v3, google, sheets_v4 } from 'googleapis';
import * as zCore from 'zod/v4/core';
import { getPropertyPaths } from '../zod.utils';
import { initGoogleCloudCredentials } from './gcloud.helper';
import {
  SheetValueInputOption,
  SheetValueRenderOption,
} from './sheet-options.models';

const sheets = google.sheets({ version: 'v4' });
const drive = google.drive({ version: 'v3' });

@Injectable()
export default class SheetService {
  private readonly logger = new Logger(SheetService.name);

  readonly RETRY_STRATEGY: Options = {
    minTimeout: 60000, // Wait for 1min due to sheet api quota limitation
  };

  readonly A_CODE_CHAR = 65;
  readonly DEFAULT_RANGE = 'A:Z';

  private authClient:
    | auth.Compute
    | auth.JWT
    | auth.UserRefreshClient
    | auth.BaseExternalAccountClient
    | auth.Impersonated
    | null = null;

  async getAuthClient(): Promise<
    | auth.Compute
    | auth.JWT
    | auth.UserRefreshClient
    | auth.BaseExternalAccountClient
    | auth.Impersonated
  > {
    if (!this.authClient) {
      initGoogleCloudCredentials();
      this.authClient = await google.auth.getClient({
        scopes: [
          'https://www.googleapis.com/auth/spreadsheets',
          'https://www.googleapis.com/auth/drive',
        ],
      });
    }
    return this.authClient;
  }

  getMimeTypeFromFileName(fileName: string): string {
    if (fileName.endsWith('.xlsx')) {
      return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    }
    // TODO: complete if needed
    return 'application/vnd.google-apps.spreadsheet';
  }

  async downloadFile(fileId: string, fileName: string, res: Response) {
    const authClient = await this.getAuthClient();

    const mimeType = this.getMimeTypeFromFileName(fileName);
    this.logger.log(
      `Téléchargement du fichier ${fileId} au format ${mimeType}`
    );

    res.setHeader('Content-Type', mimeType);
    res.setHeader(
      'Access-Control-Expose-Headers',
      'Content-Disposition, Filename'
    );
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Filename', fileName);

    const downloadOptions: drive_v3.Params$Resource$Files$Export = {
      auth: authClient,
      fileId: fileId,
      mimeType: mimeType,
    };
    const downloadResponse = await drive.files.export(downloadOptions, {
      responseType: 'stream',
    });
    return downloadResponse.data.pipe(res);
  }

  async getFileIdByName(
    fileName: string,
    parentFolderId?: string
  ): Promise<string | null> {
    const authClient = await this.getAuthClient();

    this.logger.log(`Recherche du fichier avec le nom ${fileName}`);

    const searchOptions: drive_v3.Params$Resource$Files$List = {
      auth: authClient,
      q: `name='${fileName}'${
        parentFolderId ? ` and '${parentFolderId}' in parents` : ''
      }`,
      fields: 'files(id)',
    };
    const searchResponse = await drive.files.list(searchOptions);
    const files = searchResponse.data.files;
    return files?.[0]?.id ?? null;
  }

  async copyFile(
    fileId: string,
    copyTitle: string,
    parents?: string[]
  ): Promise<string> {
    const authClient = await this.getAuthClient();

    this.logger.log(
      `Copie du Spreadsheet ${fileId} vers un nouveau fichier avec le nom ${copyTitle}`
    );

    const copyOptions: drive_v3.Params$Resource$Files$Copy = {
      auth: authClient,
      fileId: fileId,
      supportsAllDrives: true,
      requestBody: {
        name: copyTitle,
        parents: parents,
      },
    };
    const copyResponse = await drive.files.copy(copyOptions);
    return copyResponse.data.id ?? '';
  }

  async deleteFile(fileId: string) {
    const authClient = await this.getAuthClient();
    const deleteOptions: drive_v3.Params$Resource$Files$Delete = {
      auth: authClient,
      fileId: fileId,
    };
    await drive.files.delete(deleteOptions);
    this.logger.log(`Spreadsheet ${fileId} correctement supprimé.`);
  }

  async getFileName(fileId: string): Promise<string> {
    const authClient = await this.getAuthClient();
    const getOptions: drive_v3.Params$Resource$Files$Get = {
      auth: authClient,
      fileId: fileId,
      fields: 'name',
    };
    const res = await drive.files.get(getOptions);
    return res.data.name ?? '';
  }

  async getFileData(fileId: string): Promise<Buffer> {
    const authClient = await this.getAuthClient();
    const getOptions: drive_v3.Params$Resource$Files$Get = {
      auth: authClient,
      fileId: fileId,
      alt: 'media',
    };
    const res = await drive.files.get(
      getOptions,
      { responseType: 'arraybuffer' } // Use arraybuffer to get binary data
    );

    // @ts-expect-error erreur non gérée
    return Buffer.from(res.data);
  }

  async getRawDataFromSheet(
    spreadsheetId: string,
    range: string,
    valueRenderOption: SheetValueRenderOption = SheetValueRenderOption.FORMATTED_VALUE
  ): Promise<{
    data: any[][] | null;
  }> {
    const authClient = await this.getAuthClient();

    const sheetValues = await this.executeWithQuotaRetry(
      async (
        bail: (e: Error) => void,
        _num: number
      ): Promise<sheets_v4.Schema$ValueRange | undefined> => {
        const getOptions: sheets_v4.Params$Resource$Spreadsheets$Values$Get = {
          auth: authClient,
          spreadsheetId: spreadsheetId,
          range: range,
          valueRenderOption: valueRenderOption,
        };
        this.logger.log(
          `Get raw data from sheet ${spreadsheetId} with range ${range} (attempt ${_num})`
        );
        const sheetResponse = await sheets.spreadsheets.values.get(getOptions);
        return sheetResponse.data;
      }
    );

    return { data: sheetValues?.values || null };
  }

  async executeWithQuotaRetry<T>(
    fn: (bail: (err: Error) => void, num: number) => Promise<T>
  ): Promise<T> {
    return retry(async (bail, num): Promise<T | undefined> => {
      try {
        return await fn(bail, num);
      } catch (error) {
        this.logger.error(error);
        if (error instanceof gaxios.GaxiosError) {
          const gaxiosError = error as gaxios.GaxiosError;
          this.logger.error(
            `Error while executing function: status ${gaxiosError.status}, code ${gaxiosError.code}, message: ${gaxiosError.message}`
          );
          if (error.status === 429) {
            this.logger.log(`Quota limitation, retrying`);
            throw error;
          }
        }
        // No need to retry
        bail(error as Error);
      }
    }, this.RETRY_STRATEGY) as Promise<T>;
  }

  getRecordRowToWrite(record: any, header: string[]): any[] {
    const row: any[] = [];
    header.forEach((fieldName) => {
      if (record[fieldName] !== undefined && record[fieldName] !== null) {
        if (Array.isArray(record[fieldName])) {
          row.push(record[fieldName].join(', '));
        } else {
          row.push(record[fieldName]);
        }
      } else {
        row.push('');
      }
    });
    return row;
  }

  async overwriteTypedDataToSheet<T>(
    spreadhsheetId: string,
    header: (keyof T)[],
    data: T[],
    sheetName?: string,
    valueInputOption?: SheetValueInputOption
  ) {
    const stringHeader = header as string[];
    const range = this.getDefaultRangeFromHeader(stringHeader, sheetName);
    const rowDataToWrite: any[][] = data.map((record) =>
      this.getRecordRowToWrite(record, stringHeader)
    );
    const allData = [header, ...rowDataToWrite];
    return this.overwriteRawDataToSheet(
      spreadhsheetId,
      range,
      allData,
      valueInputOption
    );
  }

  async overwriteRawDataToSheet(
    spreadsheetId: string,
    range: string,
    data: any[][],
    valueInputOption?: SheetValueInputOption
  ) {
    const authClient = await this.getAuthClient();
    await this.executeWithQuotaRetry(
      async (bail: (e: Error) => void, num: number): Promise<void> => {
        this.logger.log(
          `Overwrite data to sheet ${spreadsheetId} in range ${range} (attempt ${num})`
        );
        await sheets.spreadsheets.values.update({
          auth: authClient,
          spreadsheetId,
          range: range,
          valueInputOption: valueInputOption || SheetValueInputOption.RAW,
          requestBody: {
            values: data,
          },
        });
      }
    );
  }

  getDefaultRangeFromHeader(header: string[], sheetName?: string): string {
    const numLetters = header.length;
    let rangeEnd = '';
    const quotient = Math.floor(numLetters / 26);
    const remainder = numLetters % 26;
    if (quotient > 0) {
      rangeEnd += String.fromCharCode(this.A_CODE_CHAR + quotient - 1);
    }
    rangeEnd += String.fromCharCode(this.A_CODE_CHAR + remainder - 1);
    const rangeWithoutSheet = `A:${rangeEnd}`;
    if (sheetName) {
      return `${sheetName}!${rangeWithoutSheet}`;
    }
    return rangeWithoutSheet;
  }

  async getDataFromSheet<T extends Record<string, unknown>>(
    spreadsheetId: string,
    schema: zCore.$ZodObject,
    range?: string,
    idProperties?: (keyof T)[],
    templateData?: Partial<T>
  ): Promise<{ data: T[]; header: string[] | null }> {
    const expectedHeader = getPropertyPaths(schema);
    this.logger.log(
      `Found schema for sheet with expected header ${expectedHeader}`
    );
    if (!range) {
      range = this.getDefaultRangeFromHeader(expectedHeader);
      this.logger.log(`Use default range ${range} from schema`);
    } else {
      this.logger.log(`Use range ${range} for schema`);
    }

    const data: any[] = [];
    let header: string[] | null = null;
    const readDataResult = await this.getRawDataFromSheet(
      spreadsheetId,
      range || this.DEFAULT_RANGE
    );
    if (readDataResult.data) {
      header = readDataResult.data[0];
      for (let iRow = 1; iRow < readDataResult.data.length; iRow++) {
        const dataRecord: any = { ...templateData };
        const row = readDataResult.data[iRow];
        const emptyRow = row.every(
          (cell) =>
            isNil(cell) || cell === '' || cell?.toLowerCase() === 'false'
        );
        if (!emptyRow) {
          for (let iField = 0; iField < row.length; iField++) {
            if (header[iField]) {
              const fieldName = header[iField].trim();
              const fieldNameSchema = expectedHeader.find(
                (header) => header.toLowerCase() === fieldName.toLowerCase()
              );
              let fieldDef =
                fieldNameSchema && schema._zod.def.shape
                  ? schema._zod.def.shape[fieldNameSchema]
                  : null;
              if (fieldDef instanceof zCore.$ZodOptional) {
                fieldDef = fieldDef._zod.def.innerType;
              }
              if (fieldDef instanceof zCore.$ZodNullable) {
                fieldDef = fieldDef._zod.def.innerType;
              }
              // Skip empty fields, warning: 0 is not empty
              if (
                fieldNameSchema &&
                row[iField] !== undefined &&
                row[iField] !== null &&
                row[iField] !== ''
              ) {
                let value: string | number | boolean = `${row[iField]}`.trim();
                // Always save original field name, to be able to keep it for debugging
                set(dataRecord, fieldNameSchema, value);

                //logger.info(`Found field ${fieldName} with value ${row[iField]}`);

                // try to parse as float
                if (fieldDef instanceof zCore.$ZodNumber) {
                  // Remove spaces
                  const valueWithoutSpace = value.replace(/\s/g, '');
                  //console.log(valueWithoutSpace);
                  let floatValue = parseFloat(valueWithoutSpace);
                  if (!isNaN(floatValue)) {
                    //console.log(`Parsed as float ${floatValue}`);
                    // Try to replace , by .
                    floatValue = parseFloat(
                      valueWithoutSpace.replace(/,/g, '.')
                    );
                    //console.log(`Parsed as float ${floatValue}`);
                    const floatValueStr = floatValue.toString();
                    if (
                      fieldNameSchema ||
                      floatValueStr.length === value.length
                    ) {
                      value = floatValue;
                    }
                  }
                } else if (fieldDef instanceof zCore.$ZodBoolean) {
                  // Remove spaces
                  const valueWithoutSpace = value
                    .replace(/\s/g, '')
                    .toLowerCase();
                  value = valueWithoutSpace === 'true' ? true : false;
                }
                set(dataRecord, fieldNameSchema, value);
              }
            }
          }
        }

        if (!emptyRow && Object.keys(dataRecord).length > 0) {
          // lines without id are ignored
          let missingIdProperties = false;
          if (idProperties) {
            missingIdProperties = idProperties.some((idProperty) =>
              isNil(dataRecord[idProperty])
            );
          }
          if (!missingIdProperties) {
            try {
              const parsedDataRecord = zCore.parse(schema, dataRecord);
              data.push(parsedDataRecord);
            } catch (e) {
              let errorMessage = `Invalid sheet record on line ${iRow} ${JSON.stringify(
                dataRecord
              )}`;
              this.logger.error(errorMessage);
              this.logger.error(e);
              if (e instanceof zCore.$ZodError) {
                const errorList = e.issues.map((error) => {
                  return `${error.path.join('.')} - ${error.message} (${
                    error.code
                  })`;
                });
                errorMessage += `: ${errorList.join(', ')}`;
              }
              throw new HttpException(errorMessage, HttpStatus.BAD_REQUEST);
            }
          } else {
            this.logger.debug(`Missing id properties on line ${iRow}`);
          }
        } else {
          this.logger.warn(`Empty record on line ${iRow}`);
        }
      }
    }
    return { data, header };
  }
}
