import { Logger, UnprocessableEntityException } from '@nestjs/common';
import * as semver from 'semver';
import SheetService from '../../utils/google-sheets/sheet.service';
import { changelogSchema, ChangelogType } from '../models/changelog.dto';

export default abstract class BaseSpreadsheetImporterService {
  private readonly CHANGELOG_SPREADSHEET_RANGE = 'Versions!A:Z';
  constructor(
    protected readonly logger: Logger,
    protected readonly sheetService: SheetService
  ) {}

  abstract getSpreadsheetId(): string;

  async checkLastVersion(currentVersion: string | null): Promise<string> {
    const spreadsheetId = this.getSpreadsheetId();
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
    } catch (e) {
      throw new UnprocessableEntityException(
        'Impossible de lire le tableau de version, veuillez vérifier que tous les champs sont correctement remplis.'
      );
    }

    if (!changeLogVersions.length) {
      throw new UnprocessableEntityException(`No version found in changelog`);
    }
    let lastVersion = changeLogVersions[0].version;
    changeLogVersions.forEach((version) => {
      if (semver.gt(version.version, lastVersion)) {
        lastVersion = version.version;
      }
    });
    this.logger.log(`Last version found in changelog: ${lastVersion}`);
    if (currentVersion && !semver.gt(lastVersion, currentVersion)) {
      throw new UnprocessableEntityException(
        `Version ${lastVersion} is not greater than current version ${currentVersion}, please add a new version in the changelog`
      );
    } else {
      // Return last version
      return lastVersion;
    }
  }
}
