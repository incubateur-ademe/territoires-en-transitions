import { Logger, UnprocessableEntityException } from '@nestjs/common';
import * as semver from 'semver';
import SheetService from '../../utils/google-sheets/sheet.service';
import { changelogSchema, ChangelogType } from '../models/changelog.dto';

export default abstract class BaseSpreadsheetImporterService {
  private readonly CHANGELOG_SPREADSHEET_RANGE = 'Versions!A:C';
  abstract readonly logger: Logger;

  constructor(protected readonly sheetService: SheetService) {}

  async checkLastVersion(
    spreadsheetId: string,
    currentVersion: string | null,
    allowVersionOverwrite?: boolean
  ): Promise<string> {
    const { version: lastVersion } = await this.readLastVersion(spreadsheetId);
    if (currentVersion && !semver.gt(lastVersion, currentVersion)) {
      if (allowVersionOverwrite) {
        this.logger.log(`Ecrasement de la version actuelle (${lastVersion})`);
      } else {
        throw new UnprocessableEntityException(
          `Version ${lastVersion} is not greater than current version ${currentVersion}, please add a new version in the changelog`
        );
      }
    }
    return lastVersion;
  }

  protected async readLastVersion(
    spreadsheetId: string
  ): Promise<ChangelogType> {
    let changeLogVersions: ChangelogType[] = [];
    try {
      const changelogData =
        await this.sheetService.getDataFromSheet<ChangelogType>(
          spreadsheetId,
          changelogSchema,
          this.CHANGELOG_SPREADSHEET_RANGE,
          ['version']
        );
      changeLogVersions = changelogData.data;
    } catch {
      throw new UnprocessableEntityException(
        'Impossible de lire le tableau de version, veuillez vérifier que tous les champs sont correctement remplis.'
      );
    }

    if (!changeLogVersions.length) {
      throw new UnprocessableEntityException(`No version found in changelog`);
    }
    let lastVersion = changeLogVersions[0];
    changeLogVersions.forEach((version) => {
      if (semver.gt(version.version, lastVersion.version)) {
        lastVersion = version;
      }
    });
    this.logger.log(`Last version found in changelog: ${lastVersion.version}`);
    return lastVersion;
  }
}
