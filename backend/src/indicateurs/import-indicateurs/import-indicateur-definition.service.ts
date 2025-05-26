import {
  categorieTagTable,
  CreateCategorieTagType,
} from '@/backend/collectivites/index-domain';
import { indicateurDefinitionTable } from '@/backend/indicateurs/index-domain';
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
import CrudValeursService from '@/backend/indicateurs/valeurs/crud-valeurs.service';
import { actionRelationTable } from '@/backend/referentiels/index-domain';
import {
  CreateThematiqueType,
  thematiqueTable,
} from '@/backend/shared/index-domain';
import { DatabaseService } from '@/backend/utils';
import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
} from '@nestjs/common';
import { DepGraph } from 'dependency-graph';
import { inArray } from 'drizzle-orm';
import { omit } from 'lodash';
import BaseSpreadsheetImporterService from '../../shared/services/base-spreadsheet-importer.service';
import ConfigurationService from '../../utils/config/configuration.service';
import { buildConflictUpdateColumns } from '../../utils/database/conflict.utils';
import SheetService from '../../utils/google-sheets/sheet.service';
import { getErrorMessage } from '../../utils/nest/errors.utils';
import { ListDefinitionsService } from '../list-definitions/list-definitions.service';
import { indicateurObjectifTable } from '../shared/models/indicateur-objectif.table';
import IndicateurValeurExpressionParserService from '../valeurs/indicateur-valeur-expression-parser.service';
import {
  importIndicateurDefinitionSchema,
  ImportIndicateurDefinitionType,
} from './import-indicateur-definition.dto';
import {
  importObjectifSchema,
  ImportObjectifType,
} from './import-indicateur-objectif.dto';

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
      'precision',
      'description',
      'exprCible',
      'exprSeuil',
      'libelleCibleSeuil',
    ];

  private readonly INDICATEUR_OBJECTIFS_SPREADSHEET_NAME = 'Objectifs';
  private readonly INDICATEUR_OBJECTIFS_SPREADSHEET_HEADER: (keyof ImportObjectifType)[] =
    ['identifiantReferentiel', 'dateValeur', 'formule'];

  constructor(
    private readonly configurationService: ConfigurationService,
    private readonly indicateurDefinitionService: ListDefinitionsService,
    private readonly indicateurValeurExpressionParserService: IndicateurValeurExpressionParserService,
    private readonly databaseService: DatabaseService,
    private readonly crudValeursService: CrudValeursService,
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

  async importIndicateurDefinitions(): Promise<{
    definitions: GetReferentielIndicateurDefinitionsReturnType;
    identifiantsRecalcules: string[];
  }> {
    const indicateurDefinitions =
      await this.indicateurDefinitionService.getReferentielIndicateurDefinitions(
        ['cae_1.a']
      );

    const spreadsheetId = this.getSpreadsheetId();
    const lastVersion = await this.checkLastVersion(
      spreadsheetId,
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
      precision: CrudValeursService.DEFAULT_ROUNDING_PRECISION,
      exprCible: null,
      exprSeuil: null,
      libelleCibleSeuil: null,
    };

    const existingDefinitionsData =
      await this.indicateurDefinitionService.getReferentielIndicateurDefinitions();

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

    const upsertedIndicateurDefinitions =
      await this.upsertIndicateurDefinitions(indicateurDefinitionsData.data);

    // Find definitions for which the formula has changed
    const updatedIndicateurDefinitionFormulas =
      upsertedIndicateurDefinitions.filter((upsertedIndicateurDefinition) => {
        const existingDefinition = existingDefinitionsData.find(
          (def) =>
            def.identifiantReferentiel ===
            upsertedIndicateurDefinition.identifiantReferentiel
        );
        return (
          upsertedIndicateurDefinition.valeurCalcule &&
          upsertedIndicateurDefinition.valeurCalcule.trim().toLowerCase() !==
            existingDefinition?.valeurCalcule?.trim().toLowerCase()
        );
      });
    this.logger.log(
      `Found ${updatedIndicateurDefinitionFormulas.length} updated indicateur definitions formulas`
    );
    const identifiantsRecalcules: string[] = [];
    if (updatedIndicateurDefinitionFormulas.length) {
      const recomputeResults =
        await this.crudValeursService.recomputeAllCalculatedIndicateurValeurs(
          undefined,
          null,
          updatedIndicateurDefinitionFormulas,
          true
        );
      recomputeResults.forEach((result) => {
        result.identifiants.forEach((identifiant) => {
          if (!identifiantsRecalcules.includes(identifiant)) {
            identifiantsRecalcules.push(identifiant);
          }
        });
      });
      this.logger.log(
        `Recomputed valeurs for identifiants: ${identifiantsRecalcules.join(
          ', '
        )}`
      );
    }

    // importe les objectifs
    const objectifs = await this.importObjectifs(upsertedIndicateurDefinitions);
    if (objectifs.length) {
      try {
        await this.databaseService.db
          .insert(indicateurObjectifTable)
          .values(objectifs)
          .onConflictDoUpdate({
            target: [
              indicateurObjectifTable.indicateurId,
              indicateurObjectifTable.dateValeur,
            ],
            set: buildConflictUpdateColumns(indicateurObjectifTable, [
              'formule',
            ]),
          });

        this.logger.log(`Upsert ${objectifs.length} indicateur objectifs`);
      } catch (e) {
        throw new HttpException(
          `Error upserting indicateur objectifs: ${getErrorMessage(e)}`,
          HttpStatus.INTERNAL_SERVER_ERROR
        );
      }
    }

    return {
      definitions: upsertedIndicateurDefinitions,
      identifiantsRecalcules,
    };
  }

  async importObjectifs(
    definitions: GetReferentielIndicateurDefinitionsReturnType
  ) {
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

    return objectifsData.data
      .map(({ identifiantReferentiel, ...other }) => {
        const indicateurId = definitions.find(
          (d) => d.identifiantReferentiel === identifiantReferentiel
        )?.id;
        return indicateurId ? { indicateurId, ...other } : null;
      })
      .filter((row) => row !== null);
  }

  async checkIndicateurDefinitions(
    indicateurDefinitions: ImportIndicateurDefinitionType[]
  ): Promise<void> {
    const graph = new DepGraph();

    const indicateurDefinitionsMap = new Map<
      string,
      ImportIndicateurDefinitionType
    >();

    indicateurDefinitions.forEach((indicateur) => {
      if (indicateurDefinitionsMap.has(indicateur.identifiantReferentiel)) {
        throw new BadRequestException(
          `Duplicate indicateur identifiantReferentiel ${indicateur.identifiantReferentiel}`
        );
      }
      indicateurDefinitionsMap.set(
        indicateur.identifiantReferentiel,
        indicateur
      );

      if (indicateur.valeurCalcule) {
        try {
          const neededSourceIndicateurs =
            this.indicateurValeurExpressionParserService.extractNeededSourceIndicateursFromFormula(
              indicateur.valeurCalcule
            );
          if (
            neededSourceIndicateurs.find(
              (sourceIndicateur) =>
                sourceIndicateur.identifiant ===
                indicateur.identifiantReferentiel
            )
          ) {
            throw new HttpException(
              `Indicateur ${indicateur.identifiantReferentiel} cannot depend on itself in formula`,
              HttpStatus.BAD_REQUEST
            );
          }

          neededSourceIndicateurs.forEach((sourceIndicateur) => {
            const foundIndicateur = indicateurDefinitions.find(
              (ind) =>
                ind.identifiantReferentiel === sourceIndicateur.identifiant
            );
            if (!foundIndicateur) {
              throw new HttpException(
                `Indicateur ${indicateur.identifiantReferentiel} depends on unknown indicateur ${sourceIndicateur.identifiant}`,
                HttpStatus.BAD_REQUEST
              );
            }
          });

          this.indicateurValeurExpressionParserService.parseExpression(
            indicateur.valeurCalcule
          );

          if (!graph.hasNode(indicateur.identifiantReferentiel)) {
            graph.addNode(indicateur.identifiantReferentiel, {
              formula: indicateur.valeurCalcule,
            });
          }
          neededSourceIndicateurs.forEach((sourceIndicateur) => {
            if (!graph.hasNode(sourceIndicateur.identifiant)) {
              graph.addNode(sourceIndicateur.identifiant);
            }
            graph.addDependency(
              indicateur.identifiantReferentiel,
              sourceIndicateur.identifiant
            );
          });
        } catch (e) {
          throw new HttpException(
            `Error parsing formula ${indicateur.valeurCalcule} for indicateur ${
              indicateur.identifiantReferentiel
            }: ${getErrorMessage(e)}`,
            HttpStatus.BAD_REQUEST
          );
        }
      }
    });

    try {
      // overallOrder() will throw an error if a cycle exists
      const order = graph.overallOrder();
      this.logger.log(
        `No circular dependencies detected. Order: ${order.join(', ')}`
      );
    } catch (e) {
      throw new HttpException(
        `Circular dependency detected in indicateur definitions: ${getErrorMessage(
          e
        )}`,
        HttpStatus.BAD_REQUEST
      );
    }
  }

  async upsertIndicateurDefinitions(
    indicateurDefinitions: ImportIndicateurDefinitionType[]
  ): Promise<GetReferentielIndicateurDefinitionsReturnType> {
    await this.checkIndicateurDefinitions(indicateurDefinitions);

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
        if (
          !thematiques.find((th) => thematique === th.mdId) &&
          !thematiquesToCreate.find((th) => thematique === th.mdId)
        ) {
          thematiquesToCreate.push({ nom: thematique, mdId: thematique });
        }
      });
      indicateur.categories?.forEach((categorie) => {
        if (
          !categories.find((cat) => categorie === cat.nom) &&
          !categoriesToCreate.find((cat) => categorie === cat.nom)
        ) {
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
            'exprCible',
            'exprSeuil',
            'libelleCibleSeuil',
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
      this.logger.log(
        `Recreating ${indicateurActionValues.length} indicateur action relations`
      );
      await tx
        .delete(indicateurActionTable)
        .where(inArray(indicateurActionTable.indicateurId, indicateurIds));
      await tx.insert(indicateurActionTable).values(indicateurActionValues);

      // Recreate category relationships
      // Add missing categories
      if (categoriesToCreate.length) {
        this.logger.log(
          `Creating ${categoriesToCreate.length} missing categories`
        );
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
      this.logger.log(
        `Recreating ${indicateurCategorieValues.length} indicateur categorie relations`
      );
      await tx
        .delete(indicateurCategorieTagTable)
        .where(
          inArray(indicateurCategorieTagTable.indicateurId, indicateurIds)
        );
      await tx
        .insert(indicateurCategorieTagTable)
        .values(indicateurCategorieValues);

      // Recreate thematiques relationships
      // Add missing thematiques
      if (thematiquesToCreate.length) {
        this.logger.log(
          `Creating ${thematiquesToCreate.length} missing thematiques`
        );
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
      this.logger.log(
        `Recreating ${indicateurThematiqueValues.length} indicateur thematique relations`
      );
      await tx
        .delete(indicateurThematiqueTable)
        .where(inArray(indicateurThematiqueTable.indicateurId, indicateurIds));
      await tx
        .insert(indicateurThematiqueTable)
        .values(indicateurThematiqueValues);

      // Recreate parents relationships
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
      this.logger.log(
        `Recreating ${indicateurGroupeValues.length} indicateur parent relations`
      );
      await tx
        .delete(indicateurGroupeTable)
        .where(inArray(indicateurGroupeTable.enfant, indicateurIds));
      await tx.insert(indicateurGroupeTable).values(indicateurGroupeValues);
    });

    // We query again the db to get indicateurs with parents, etc.
    return this.indicateurDefinitionService.getReferentielIndicateurDefinitions();
  }
}
