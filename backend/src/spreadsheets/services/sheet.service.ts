import { Injectable, Logger } from '@nestjs/common';
import * as retry from 'async-retry';
import * as gaxios from 'gaxios';
import * as auth from 'google-auth-library';
import { drive_v3, google, sheets_v4 } from 'googleapis';
import SheetValueInputOption from '../models/SheetValueInputOption';
import SheetValueRenderOption from '../models/SheetValueRenderOption';
const sheets = google.sheets({ version: 'v4' });
const drive = google.drive({ version: 'v3' });

@Injectable()
export default class SheetService {
  private readonly logger = new Logger(SheetService.name);

  readonly RETRY_STRATEGY: retry.Options = {
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
      this.authClient = await google.auth.getClient({
        scopes: [
          'https://www.googleapis.com/auth/spreadsheets',
          'https://www.googleapis.com/auth/drive',
        ],
      });
    }
    return this.authClient;
  }

  async copyFile(fileId: string, copyTitle: string): Promise<string> {
    const authClient = await this.getAuthClient();

    this.logger.log(
      `Copie du Spreadsheet ${fileId} vers un nouveau fichier avec le nom ${copyTitle}`,
    );

    const copyOptions: drive_v3.Params$Resource$Files$Copy = {
      auth: authClient,
      fileId: fileId,
      requestBody: {
        name: copyTitle,
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

  async getRawDataFromSheet(
    spreadsheetId: string,
    range: string,
    valueRenderOption: SheetValueRenderOption = SheetValueRenderOption.FORMATTED_VALUE,
  ): Promise<{
    data: any[][] | null;
  }> {
    const authClient = await this.getAuthClient();

    const sheetValues = await retry(
      async (
        bail: (e: Error) => void,
        num: number,
      ): Promise<sheets_v4.Schema$ValueRange | undefined> => {
        try {
          const getOptions: sheets_v4.Params$Resource$Spreadsheets$Values$Get =
            {
              auth: authClient,
              spreadsheetId: spreadsheetId,
              range: range,
              valueRenderOption: valueRenderOption,
            };
          //logger.info(`Get raw data from sheet ${spreadsheetId} with range ${range} (attempt ${num})`);
          const sheetResponse =
            await sheets.spreadsheets.values.get(getOptions);
          return sheetResponse.data;
        } catch (error) {
          //logger.exception(error);
          if (error instanceof gaxios.GaxiosError) {
            //const gaxiosError = error as gaxios.GaxiosError;
            /*logger.error(
                      `Error while retrieving sheet data: status ${gaxiosError.status}, code ${gaxiosError.code}, message: ${gaxiosError.message}`
                  );*/
            if (error.status === 429) {
              //logger.info(`Error due to api quota limitation, retrying`);
              throw error;
            }
          }
          bail(error as Error);
        }
      },
      {},
    );

    return { data: sheetValues?.values || null };
  }

  async overwriteRawDataToSheet(
    spreadsheetId: string,
    range: string,
    data: any[][],
    valueInputOption?: SheetValueInputOption,
  ) {
    const authClient = await this.getAuthClient();
    await retry(
      async (bail: (e: Error) => void, num: number): Promise<void> => {
        try {
          this.logger.log(
            `Overwrite data to sheet ${spreadsheetId} in range ${range} (attempt ${num})`,
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
          //logger.exception(error);
          if (error instanceof gaxios.GaxiosError) {
            //const gaxiosError = error as gaxios.GaxiosError;
            /*logger.error(
                      `Error while overwriting sheet data: status ${gaxiosError.status}, code ${gaxiosError.code}, message: ${gaxiosError.message}`
                  );*/
            if (error.status === 429) {
              //logger.info(`Quota error, retrying`);
              throw error;
            }
          }
          // No need to trigger retry if it's not a quota error
          bail(error as Error);
        }
      },
      this.RETRY_STRATEGY,
    );
  }
}
