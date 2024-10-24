import { Injectable, Logger } from '@nestjs/common';
import { default as retry, Options } from 'async-retry';
import { Response } from 'express';
import * as gaxios from 'gaxios';
import * as auth from 'google-auth-library';
import { drive_v3, google, sheets_v4 } from 'googleapis';
import { initApplicationCredentials } from '../../common/services/gcloud.helper';
import {
  SheetValueInputOption,
  SheetValueRenderOption,
} from '../models/sheetoptions.models';

const sheets = google.sheets({ version: 'v4' });
const drive = google.drive({ version: 'v3' });

@Injectable()
export default class SheetService {
  private readonly logger = new Logger(SheetService.name);

  readonly RETRY_STRATEGY: Options = {
    minTimeout: 60000, // Wait for 1min due to sheet api quota limitation
  };

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
      initApplicationCredentials();
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
    if (files && files.length > 0) {
      return files[0].id!;
    }
    return null;
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
      requestBody: {
        name: copyTitle,
        parents: parents,
      },
    };
    const copyResponse = await drive.files.copy(copyOptions);
    return copyResponse.data.id!;
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
    return res.data.name!;
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

    const sheetValues = await retry(
      async (
        bail: (e: Error) => void,
        _num: number
      ): Promise<sheets_v4.Schema$ValueRange | undefined> => {
        try {
          const getOptions: sheets_v4.Params$Resource$Spreadsheets$Values$Get =
            {
              auth: authClient,
              spreadsheetId: spreadsheetId,
              range: range,
              valueRenderOption: valueRenderOption,
            };
          this.logger.log(
            `Get raw data from sheet ${spreadsheetId} with range ${range} (attempt ${_num})`
          );
          const sheetResponse = await sheets.spreadsheets.values.get(
            getOptions
          );
          return sheetResponse.data;
        } catch (error) {
          this.logger.error(error);
          if (error instanceof gaxios.GaxiosError) {
            const gaxiosError = error as gaxios.GaxiosError;
            this.logger.error(
              `Error while retrieving sheet data: status ${gaxiosError.status}, code ${gaxiosError.code}, message: ${gaxiosError.message}`
            );
            if (error.status === 429) {
              this.logger.log(`Error due to api quota limitation, retrying`);
              throw error;
            }
          }
          bail(error as Error);
        }
      },
      {}
    );

    return { data: sheetValues?.values || null };
  }

  async overwriteRawDataToSheet(
    spreadsheetId: string,
    range: string,
    data: any[][],
    valueInputOption?: SheetValueInputOption
  ) {
    const authClient = await this.getAuthClient();
    await retry(
      async (bail: (e: Error) => void, num: number): Promise<void> => {
        try {
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
        } catch (error) {
          this.logger.error(error);
          if (error instanceof gaxios.GaxiosError) {
            const gaxiosError = error as gaxios.GaxiosError;
            this.logger.error(
              `Error while overwriting sheet data: status ${gaxiosError.status}, code ${gaxiosError.code}, message: ${gaxiosError.message}`
            );
            if (error.status === 429) {
              this.logger.log(`Quota error, retrying`);
              throw error;
            }
          }
          // No need to trigger retry if it's not a quota error
          bail(error as Error);
        }
      },
      this.RETRY_STRATEGY
    );
  }
}
