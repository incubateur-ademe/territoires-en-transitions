import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import PersonnalisationsExpressionService from '@tet/backend/collectivites/personnalisations/services/personnalisations-expression.service';
import { DEFAULT_ROUNDING_PRECISION } from '../valeurs/valeurs.constants';
import VersionService from '@tet/backend/utils/version/version.service';
import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import type { AuthenticatedOrServiceRoleUser } from '@tet/backend/users/models/auth.models';
import BaseSpreadsheetImporterService from '../../shared/services/base-spreadsheet-importer.service';
import ConfigurationService from '../../utils/config/configuration.service';
import SheetService from '../../utils/google-sheets/sheet.service';
import { IndicateurFormulaReconciliationService } from '../definitions/indicateur-formula-reconciliation.service';
import { ListPlatformDefinitionsRepository } from '../definitions/list-platform-definitions/list-platform-definitions.repository';
import IndicateurExpressionService from '../valeurs/indicateur-expression.service';
import {
  importIndicateurDefinitionSchema,
  ImportIndicateurDefinitionType,
} from './import-indicateur-definition.dto';
import {
  importObjectifSchema,
  ImportObjectifType,
} from './import-indicateur-objectif.dto';
import { getImportResultOrThrow } from './import-indicateur-definition.errors';
import type {
  PlatformDefinitions,
  UpsertIndicateurDefinitionsResult,
} from './import-indicateur-definition.types';
import { mapIndicateurObjectifs } from './map-indicateur-objectifs.rules';
import {
  validateIndicateurDefinitions,
  validateObjectifIdentifiants,
} from './validate-indicateur-definitions.rules';
import { UpsertIndicateurDefinitionsService } from './upsert-indicateur-definitions.service';

type FormulaReconciliationResult = Readonly<{
  status: 'complete' | 'pending' | 'failed';
  identifiantsRecalcules: string[];
  reconciliationsMisesEnFile: number;
  reconciliationsRestantes: number | null;
  reconciliationsEchouees: number | null;
  message?: string;
}>;

type ImportIndicateurDefinitionsResult = Readonly<{
  status: 'committed';
  definitions: PlatformDefinitions;
  reconciliation: FormulaReconciliationResult;
}>;

@Injectable()
export default class ImportIndicateurDefinitionService extends BaseSpreadsheetImporterService {
  readonly logger = new Logger(ImportIndicateurDefinitionService.name);

  private readonly INDICATEUR_DEFINITIONS_SPREADSHEET_NAME =
    'Indicateur definitions';

  // We read more columns than needed to avoid issues with empty/not used columns
  private readonly INDICATEUR_DEFINITIONS_SPREADSHEET_RANGE = 'A:Z';

  private readonly INDICATEUR_OBJECTIFS_SPREADSHEET_NAME = 'Objectifs';
  private readonly INDICATEUR_OBJECTIFS_SPREADSHEET_HEADER: (keyof ImportObjectifType)[] =
    ['identifiantReferentiel', 'dateValeur', 'formule'];

  constructor(
    private readonly configurationService: ConfigurationService,
    private readonly listPlatformDefinitionsRepository: ListPlatformDefinitionsRepository,
    private readonly indicateurExpressionService: IndicateurExpressionService,
    private readonly personnalisationsExpressionService: PersonnalisationsExpressionService,
    private readonly formulaReconciliationService: IndicateurFormulaReconciliationService,
    private readonly versionService: VersionService,
    private readonly permissionService: PermissionService,
    private readonly upsertService: UpsertIndicateurDefinitionsService,
    sheetService: SheetService
  ) {
    super(sheetService);
  }

  getSpreadsheetId(): string {
    const spreadsheetId = this.configurationService.get(
      'INDICATEUR_DEFINITIONS_SHEET_ID'
    );
    if (!spreadsheetId) {
      throw new HttpException(
        `Indicateur defintions cannot be imported, missing configuration`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
    return spreadsheetId;
  }

  private getIndicateurDefinitionsSheetRange(): string {
    return `${this.INDICATEUR_DEFINITIONS_SPREADSHEET_NAME}!${this.INDICATEUR_DEFINITIONS_SPREADSHEET_RANGE}`;
  }

  async importIndicateurDefinitions(
    user: AuthenticatedOrServiceRoleUser
  ): Promise<ImportIndicateurDefinitionsResult> {
    this.permissionService.hasServiceRole(user);

    const indicateurDefinitions =
      await this.listPlatformDefinitionsRepository.listPlatformDefinitions({
        identifiantsReferentiel: ['cae_1.a'],
      });

    const allowVersionOverwrite =
      this.versionService.getVersion().environment !== 'prod';
    const currentVersion = indicateurDefinitions[0]?.version ?? null;

    const spreadsheetId = this.getSpreadsheetId();
    const lastVersion = await this.checkLastVersion(
      spreadsheetId,
      currentVersion,
      allowVersionOverwrite
    );

    const sheetRange = this.getIndicateurDefinitionsSheetRange();

    const indicateurDefinitionsData =
      await this.sheetService.getDataFromSheet<ImportIndicateurDefinitionType>(
        spreadsheetId,
        importIndicateurDefinitionSchema,
        sheetRange,
        undefined,
        this.getTemplateData(lastVersion)
      );
    this.logger.log(
      `Found ${indicateurDefinitionsData.data.length} indicateur definitions`
    );

    // Lire et valider toutes les feuilles avant la transaction évite de
    // publier une nouvelle version du catalogue si la feuille des objectifs
    // est illisible ou invalide.
    const importedObjectifs = await this.readObjectifs();

    const {
      definitions: upsertedIndicateurDefinitions,
      updatedFormulaDefinitions,
      importedIndicateurIds,
      reconciliationWorkItemsCount,
    } = await this.upsertIndicateurDefinitions(
      indicateurDefinitionsData.data,
      importedObjectifs
    );

    this.logger.log(
      `Found ${updatedFormulaDefinitions.length} updated indicateur definitions formulas and ${reconciliationWorkItemsCount} durable reconciliation work items`
    );
    const reconciliation = await this.tryDrainFormulaReconciliations(
      importedIndicateurIds,
      reconciliationWorkItemsCount
    );

    return {
      status: 'committed',
      definitions: upsertedIndicateurDefinitions,
      reconciliation,
    };
  }

  private async tryDrainFormulaReconciliations(
    indicateurIds: number[],
    enqueuedWorkItemsCount: number
  ): Promise<FormulaReconciliationResult> {
    try {
      const reconciliation = await this.formulaReconciliationService.drain({
        indicateurIds,
        // Une reprise explicite ne doit pas attendre le backoff du cron.
        includeDeferred: true,
      });
      if (reconciliation.identifiants.length > 0) {
        this.logger.log(
          `Recomputed valeurs for identifiants: ${reconciliation.identifiants.join(
            ', '
          )}`
        );
      }

      const status =
        reconciliation.failedCount > 0
          ? 'failed'
          : reconciliation.complete
          ? 'complete'
          : 'pending';
      return {
        status,
        identifiantsRecalcules: reconciliation.identifiants,
        reconciliationsMisesEnFile: enqueuedWorkItemsCount,
        reconciliationsRestantes: reconciliation.remainingCount,
        reconciliationsEchouees: reconciliation.failedCount,
        ...(status === 'failed'
          ? {
              message:
                'Le catalogue est importé, mais certaines réconciliations de formules ont échoué.',
            }
          : {}),
      };
    } catch (error) {
      this.logger.error(
        'Le catalogue est importé, mais le drain des réconciliations de formules a échoué.',
        error instanceof Error ? error.stack : undefined
      );
      return {
        status: 'failed',
        identifiantsRecalcules: [],
        // Le drain ayant échoué, son état exact est inconnu. On distingue donc
        // explicitement le nombre mis en file du nombre restant à traiter.
        reconciliationsMisesEnFile: enqueuedWorkItemsCount,
        reconciliationsRestantes: null,
        reconciliationsEchouees: null,
        message:
          'Le catalogue est importé, mais la réconciliation des formules reste à reprendre.',
      };
    }
  }

  // Create a template data to set version & initialize null properties
  private getTemplateData(
    version: string
  ): Partial<ImportIndicateurDefinitionType> {
    return {
      version,
      titreCourt: null,
      titreLong: null,
      description: null,
      borneMin: null,
      borneMax: null,
      valeurCalcule: null,
      precision: DEFAULT_ROUNDING_PRECISION,
      exprCible: null,
      exprSeuil: null,
      libelleCibleSeuil: null,
    };
  }

  async verifyIndicateurDefinitions(user: AuthenticatedOrServiceRoleUser) {
    this.permissionService.hasServiceRole(user);

    const spreadsheetId = this.getSpreadsheetId();

    const sheetRange = this.getIndicateurDefinitionsSheetRange();

    const indicateurDefinitionsData =
      await this.sheetService.getDataFromSheet<ImportIndicateurDefinitionType>(
        spreadsheetId,
        importIndicateurDefinitionSchema,
        sheetRange,
        undefined,
        this.getTemplateData('0.0.0')
      );
    this.logger.log(
      `Found ${indicateurDefinitionsData.data.length} indicateur definitions`
    );

    await this.checkIndicateurDefinitions(indicateurDefinitionsData.data);
    const objectifs = await this.readObjectifs();
    getImportResultOrThrow(
      validateObjectifIdentifiants(objectifs, indicateurDefinitionsData.data)
    );
    return { ok: true };
  }

  async importObjectifs(definitions: PlatformDefinitions) {
    return getImportResultOrThrow(
      mapIndicateurObjectifs(await this.readObjectifs(), definitions)
    );
  }

  private async readObjectifs(): Promise<ImportObjectifType[]> {
    const spreadsheetId = this.getSpreadsheetId();
    const sheetRange = this.sheetService.getDefaultRangeFromHeader(
      this.INDICATEUR_OBJECTIFS_SPREADSHEET_HEADER,
      this.INDICATEUR_OBJECTIFS_SPREADSHEET_NAME
    );

    const objectifsData =
      await this.sheetService.getDataFromSheet<ImportObjectifType>(
        spreadsheetId,
        importObjectifSchema,
        sheetRange
      );

    return objectifsData.data;
  }

  async checkIndicateurDefinitions(
    definitions: ImportIndicateurDefinitionType[]
  ): Promise<void> {
    getImportResultOrThrow(
      validateIndicateurDefinitions(definitions, {
        indicateurs: this.indicateurExpressionService,
        personnalisations: this.personnalisationsExpressionService,
      })
    );
  }

  async upsertIndicateurDefinitions(
    definitions: ImportIndicateurDefinitionType[],
    objectifs: ImportObjectifType[] = []
  ): Promise<UpsertIndicateurDefinitionsResult> {
    return getImportResultOrThrow(
      await this.upsertService.upsert(
        { definitions, objectifs },
        // Legacy internal/seed entrypoint; the HTTP facade authorizes the import.
        { user: null, isUserTrusted: true }
      )
    );
  }
}
