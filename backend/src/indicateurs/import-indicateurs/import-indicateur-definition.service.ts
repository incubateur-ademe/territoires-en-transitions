import {
  CreateIndicateurActionType,
  indicateurActionTable,
} from '@/backend/indicateurs/shared/models/indicateur-action.table';
import {
  CreateIndicateurCategorieTag,
  indicateurCategorieTagTable,
} from '@/backend/indicateurs/shared/models/indicateur-categorie-tag.table';
import {
  CreateIndicateurGroupe,
  indicateurGroupeTable,
} from '@/backend/indicateurs/shared/models/indicateur-groupe.table';
import {
  CreateIndicateurThematique,
  indicateurThematiqueTable,
} from '@/backend/indicateurs/shared/models/indicateur-thematique.table';
import { DatabaseService } from '@/backend/utils';
import {
  categorieTagTable,
  CreateCategorieTagType,
} from '@/domain/collectivites';
import { indicateurDefinitionTable } from '@/domain/indicateurs';
import { actionRelationTable } from '@/domain/referentiels';
import { CreateThematiqueType, thematiqueTable } from '@/domain/shared';
import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { inArray } from 'drizzle-orm';
import { omit } from 'lodash';
import BaseSpreadsheetImporterService from '../../shared/services/base-spreadsheet-importer.service';
import ConfigurationService from '../../utils/config/configuration.service';
import { buildConflictUpdateColumns } from '../../utils/database/conflict.utils';
import SheetService from '../../utils/google-sheets/sheet.service';
import ListDefinitionsService from '../definitions/list-definitions.service';
import {
  importIndicateurDefinitionSchema,
  ImportIndicateurDefinitionType,
} from './import-indicateur-definition.dto';

type GetReferentielIndicateurDefinitionsReturnType = Awaited<
  ReturnType<ListDefinitionsService['getReferentielIndicateurDefinitions']>
>;

@Injectable()
export default class ImportIndicateurDefinitionService extends BaseSpreadsheetImporterService {
  private readonly INDICATEUR_DEFINITIONS_SPREADSHEET_NAME =
    'Indicateur definitions';

  private readonly INDICATEUR_DEFINITIONS_SPREADSHEET_HEADER: (keyof ImportIndicateurDefinitionType)[] =
    [
      'identifiantReferentiel',
      'titre',
      'unite',
      'titreCourt',
      'titreLong',
      'parents',
      'categories',
      'thematiques',
      'actionIds',
      'valeurCalcule',
      'participationScore',
      'sansValeurUtilisateur',
      'borneMin',
      'borneMax',
      'description',
    ];

  constructor(
    private readonly configurationService: ConfigurationService,
    private readonly indicateurDefinitionService: ListDefinitionsService,
    private readonly databaseService: DatabaseService,
    sheetService: SheetService
  ) {
    super(new Logger(ImportIndicateurDefinitionService.name), sheetService);
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

  async fillSpreadsheetWithIndicateurDefinitions(): Promise<{
    data: ImportIndicateurDefinitionType[];
  }> {
    const indicateurDefinitions =
      await this.indicateurDefinitionService.getReferentielIndicateurDefinitions();
    const importIndicateurDefinitions = indicateurDefinitions.map(
      (indicateur) => {
        const importIndicateurDefinitions: ImportIndicateurDefinitionType =
          omit(
            indicateur,
            'thematiques',
            'actions',
            'categories',
            'parents',
            'groupementId',
            'collectiviteId',
            'modifiedAt',
            'modifiedBy',
            'createdAt',
            'createdBy',
            'id'
          ) as ImportIndicateurDefinitionType; // we are sure in this case that identifiantReferentiel is defined
        const thematiqueMids: string[] = indicateur.thematiques
          ?.filter((thematique) => Boolean(thematique.mdId))
          .map((thematique) => thematique.mdId) as string[];
        importIndicateurDefinitions.thematiques = thematiqueMids;

        const categories: string[] = indicateur.categories?.map(
          (categorie) => categorie.nom
        );
        importIndicateurDefinitions.categories = categories;

        const actionIds: string[] = indicateur.actions?.map(
          (action) => action.id
        );
        importIndicateurDefinitions.actionIds = actionIds;

        const parents: string[] = indicateur.parents?.map(
          (ind) => ind.identifiantReferentiel
        );
        importIndicateurDefinitions.parents = parents;
        return importIndicateurDefinitions;
      }
    );

    await this.sheetService.overwriteTypedDataToSheet<ImportIndicateurDefinitionType>(
      this.getSpreadsheetId(),
      this.INDICATEUR_DEFINITIONS_SPREADSHEET_HEADER,
      importIndicateurDefinitions,
      this.INDICATEUR_DEFINITIONS_SPREADSHEET_NAME
    );

    return { data: importIndicateurDefinitions };
  }

  async importIndicateurDefinitions(): Promise<GetReferentielIndicateurDefinitionsReturnType> {
    const indicateurDefinitions =
      await this.indicateurDefinitionService.getReferentielIndicateurDefinitions(
        ['cae_1.a']
      );

    const spreadsheetId = this.getSpreadsheetId();
    const lastVersion = await this.checkLastVersion(
      indicateurDefinitions.length ? indicateurDefinitions[0].version : null
    );

    const sheetRange = this.sheetService.getDefaultRangeFromHeader(
      this.INDICATEUR_DEFINITIONS_SPREADSHEET_HEADER,
      this.INDICATEUR_DEFINITIONS_SPREADSHEET_NAME
    );
    // Create a template data to set version & initialize null properties
    const templateData: Partial<ImportIndicateurDefinitionType> = {
      version: lastVersion,
      titreCourt: null,
      titreLong: null,
      description: null,
      borneMin: null,
      borneMax: null,
      valeurCalcule: null,
    };

    const indicateurDefinitionsData =
      await this.sheetService.getDataFromSheet<ImportIndicateurDefinitionType>(
        spreadsheetId,
        importIndicateurDefinitionSchema,
        sheetRange,
        undefined,
        templateData
      );
    this.logger.log(
      `Found ${indicateurDefinitionsData.data.length} indicateur definitions`
    );

    return this.upsertIndicateurDefinitions(indicateurDefinitionsData.data);
  }

  async upsertIndicateurDefinitions(
    indicateurDefinitions: ImportIndicateurDefinitionType[]
  ): Promise<GetReferentielIndicateurDefinitionsReturnType> {
    const thematiques = await this.databaseService.db
      .select()
      .from(thematiqueTable);
    const categories = await this.databaseService.db
      .select()
      .from(categorieTagTable);
    const actionIds = await this.databaseService.db
      .select()
      .from(actionRelationTable);

    // Check that existing thematiques, categories and actions are present
    const categoriesToCreate: CreateCategorieTagType[] = [];
    const thematiquesToCreate: CreateThematiqueType[] = [];
    indicateurDefinitions.forEach((indicateur) => {
      indicateur.thematiques?.forEach((thematique) => {
        if (!thematiques.find((th) => thematique === th.mdId)) {
          thematiquesToCreate.push({ nom: thematique, mdId: thematique });
        }
      });
      indicateur.categories?.forEach((categorie) => {
        if (!categories.find((cat) => categorie === cat.nom)) {
          // Ok to create new categories automatically
          categoriesToCreate.push({ nom: categorie });
        }
      });
      indicateur.actionIds?.forEach((actionId) => {
        if (!actionIds.find((act) => actionId === act.id)) {
          throw new HttpException(
            `Action ${actionId} not found for indicateur ${indicateur.identifiantReferentiel}`,
            HttpStatus.BAD_REQUEST
          );
        }
      });
    });

    const indicateurDefinitionsToCreate = indicateurDefinitions.map(
      (indicateur) =>
        omit(indicateur, 'actionIds', 'categories', 'thematiques', 'parents')
    );

    this.logger.log(
      `Upserting ${indicateurDefinitionsToCreate.length} indicateurs with thematiques, categories and actions in a transaction`
    );

    await this.databaseService.db.transaction(async (tx) => {
      const createdIndicateurs = await tx
        .insert(indicateurDefinitionTable)
        .values(indicateurDefinitionsToCreate)
        .onConflictDoUpdate({
          target: [indicateurDefinitionTable.identifiantReferentiel],
          set: buildConflictUpdateColumns(indicateurDefinitionTable, [
            'titre',
            'titreLong',
            'titreCourt',
            'unite',
            'borneMin',
            'borneMax',
            'collectiviteId',
            'participationScore',
            'sansValeurUtilisateur',
            'description',
            //'groupementId',
            'valeurCalcule',
            'modifiedAt',
            'modifiedBy',
            'version',
          ]),
        })
        .returning();
      const indicateurIds = createdIndicateurs.map(
        (indicateur) => indicateur.id
      );

      // Recreate action relationships
      await tx
        .delete(indicateurActionTable)
        .where(inArray(indicateurActionTable.indicateurId, indicateurIds));

      const indicateurActionValues: CreateIndicateurActionType[] = [];
      indicateurDefinitions.forEach((indicateur) => {
        indicateur.actionIds?.forEach((actionId) => {
          indicateurActionValues.push({
            indicateurId: createdIndicateurs.find(
              (ind) =>
                ind.identifiantReferentiel === indicateur.identifiantReferentiel
            )!.id,
            actionId,
          });
        });
      });
      await tx.insert(indicateurActionTable).values(indicateurActionValues);

      // Recreate category relationships
      await tx
        .delete(indicateurCategorieTagTable)
        .where(
          inArray(indicateurCategorieTagTable.indicateurId, indicateurIds)
        );
      // Add missing categories
      if (categoriesToCreate.length) {
        const createdCategories = await tx
          .insert(categorieTagTable)
          .values(categoriesToCreate)
          .returning();
        categories.push(...createdCategories);
      }
      const indicateurCategorieValues: CreateIndicateurCategorieTag[] = [];
      indicateurDefinitions.forEach((indicateur) => {
        indicateur.categories?.forEach((categorie) => {
          const categorieId = categories.find(
            (cat) => cat.nom === categorie
          )?.id;
          if (!categorieId) {
            throw new HttpException(
              `Categorie ${categorieId} not found for indicateur ${indicateur.identifiantReferentiel}`,
              HttpStatus.BAD_REQUEST
            );
          }

          indicateurCategorieValues.push({
            indicateurId: createdIndicateurs.find(
              (ind) =>
                ind.identifiantReferentiel === indicateur.identifiantReferentiel
            )!.id,
            categorieTagId: categorieId,
          });
        });
      });
      await tx
        .insert(indicateurCategorieTagTable)
        .values(indicateurCategorieValues);

      // Recreate thematiques relationships
      await tx
        .delete(indicateurThematiqueTable)
        .where(inArray(indicateurThematiqueTable.indicateurId, indicateurIds));
      // Add missing thematiques
      if (thematiquesToCreate.length) {
        const createdThematiques = await tx
          .insert(thematiqueTable)
          .values(thematiquesToCreate)
          .returning();
        thematiques.push(...createdThematiques);
      }
      const indicateurThematiqueValues: CreateIndicateurThematique[] = [];
      indicateurDefinitions.forEach((indicateur) => {
        indicateur.thematiques?.forEach((thematique) => {
          const thematiqueId = thematiques.find(
            (them) => them.mdId === thematique || them.nom === thematique
          )?.id;
          if (!thematiqueId) {
            throw new HttpException(
              `Thematique ${thematique} not found for indicateur ${indicateur.identifiantReferentiel}`,
              HttpStatus.BAD_REQUEST
            );
          }

          indicateurThematiqueValues.push({
            indicateurId: createdIndicateurs.find(
              (ind) =>
                ind.identifiantReferentiel === indicateur.identifiantReferentiel
            )!.id,
            thematiqueId: thematiqueId,
          });
        });
      });
      await tx
        .insert(indicateurThematiqueTable)
        .values(indicateurThematiqueValues);

      // Recreate parents relationships
      await tx
        .delete(indicateurGroupeTable)
        .where(inArray(indicateurGroupeTable.enfant, indicateurIds));
      const indicateurGroupeValues: CreateIndicateurGroupe[] = [];
      indicateurDefinitions.forEach((indicateur) => {
        indicateur.parents?.forEach((parent) => {
          indicateurGroupeValues.push({
            enfant: createdIndicateurs.find(
              (ind) =>
                ind.identifiantReferentiel === indicateur.identifiantReferentiel
            )!.id,
            parent: createdIndicateurs.find(
              (ind) => ind.identifiantReferentiel === parent
            )!.id,
          });
        });
      });
      await tx.insert(indicateurGroupeTable).values(indicateurGroupeValues);
    });

    // We query again the db to get indicateurs with parents, etc.
    return this.indicateurDefinitionService.getReferentielIndicateurDefinitions();
  }
}
