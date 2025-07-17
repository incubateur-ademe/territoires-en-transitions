import { collectiviteDefaultModuleKeysSchema } from '@/backend/collectivites/tableau-de-bord/collectivite-default-module-keys.schema';
import { collectiviteModuleEnumTypeSchema } from '@/backend/collectivites/tableau-de-bord/collectivite-module-type.schema';
import {
  CollectiviteModuleType,
  createCollectiviteModuleSchema,
  CreateCollectiviteModuleType,
} from '@/backend/collectivites/tableau-de-bord/collectivite-module.schema';
import { GetTableauDeBordModuleRequestType } from '@/backend/collectivites/tableau-de-bord/get-tableau-de-bord-module.request';
import { tableauDeBordModuleTable } from '@/backend/collectivites/tableau-de-bord/tableau-de-bord-module.table';
import PlanActionsService from '@/backend/plans/fiches/plan-actions.service';
import { PermissionService } from '@/backend/users/authorizations/permission.service';
import {
  AuthUser,
  PermissionOperationEnum,
  ResourceType,
} from '@/backend/users/index-domain';
import { DatabaseService } from '@/backend/utils';
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { and, eq, isNull, sql, SQL, SQLWrapper } from 'drizzle-orm';
import { DateTime } from 'luxon';

@Injectable()
export default class TableauDeBordCollectiviteService {
  private readonly logger = new Logger(TableauDeBordCollectiviteService.name);

  /*
  Utilisation de la date de création du tableau de bord pour mettre ces modules en premier
  */
  static readonly DEFAULT_MODULE_SET_UP_DATE = '2024-10-16T12:00:00.000Z';

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly planActionsService: PlanActionsService,
    private readonly permissionService: PermissionService
  ) {}

  /**
   * Fetch les modules du tableau de bord d'une collectivité et d'un user.
   */
  async list(
    collectiviteId: number,
    authUser: AuthUser | null
  ): Promise<CollectiviteModuleType[]> {
    if (authUser) {
      await this.permissionService.isAllowed(
        authUser,
        PermissionOperationEnum['COLLECTIVITES.VISITE'],
        ResourceType.COLLECTIVITE,
        collectiviteId
      );
    }

    const data = (await this.databaseService.db
      .select()
      .from(tableauDeBordModuleTable)
      .where(
        and(
          eq(tableauDeBordModuleTable.collectiviteId, collectiviteId),
          isNull(tableauDeBordModuleTable.userId)
        )
      )) as CollectiviteModuleType[];

    data.forEach((module) => {
      module.createdAt =
        DateTime.fromISO(module.createdAt.replace(' ', 'T')).toISO() ||
        module.createdAt;
      module.modifiedAt =
        DateTime.fromISO(module.modifiedAt.replace(' ', 'T')).toISO() ||
        module.modifiedAt;
    });

    this.logger.log(
      `Modules fetched for collectivite ${collectiviteId}: ${data.length}`
    );

    const modules = await this.mergeWithDefaultModules(collectiviteId, data);

    this.logger.log(
      `Total module for collectivite ${collectiviteId} (including default): ${modules.length}`
    );

    return modules;
  }

  async upsert(
    module: CreateCollectiviteModuleType,
    authUser: AuthUser | null
  ): Promise<CollectiviteModuleType> {
    if (authUser) {
      await this.permissionService.isAllowed(
        authUser,
        PermissionOperationEnum['COLLECTIVITES.TABLEAU-DE-BORD.EDITION'],
        ResourceType.COLLECTIVITE,
        module.collectiviteId
      );
    }

    // Check the schema to avoid inserting any kind of options
    const parsedModule = createCollectiviteModuleSchema.parse(module);
    if (!parsedModule.id) {
      parsedModule.id = crypto.randomUUID();
    }

    const insertedModules = await this.databaseService.db
      .insert(tableauDeBordModuleTable)
      .values(parsedModule)
      .onConflictDoUpdate({
        target: [tableauDeBordModuleTable.id],
        set: {
          titre: sql.raw(`excluded.${tableauDeBordModuleTable.titre.name}`),
          options: sql.raw(`excluded.${tableauDeBordModuleTable.options.name}`),
        },
      })
      .returning();

    this.logger.log(
      `Module upserted for collectivite ${insertedModules[0].collectiviteId} with id ${insertedModules[0].id}`
    );
    return insertedModules[0] as CollectiviteModuleType;
  }

  async delete(
    collectiviteId: number,
    moduleId: string,
    authUser: AuthUser | null
  ) {
    if (authUser) {
      await this.permissionService.isAllowed(
        authUser,
        PermissionOperationEnum['COLLECTIVITES.TABLEAU-DE-BORD.EDITION'],
        ResourceType.COLLECTIVITE,
        collectiviteId
      );
    }

    const result = await this.databaseService.db
      .delete(tableauDeBordModuleTable)
      .where(
        and(
          eq(tableauDeBordModuleTable.collectiviteId, collectiviteId),
          eq(tableauDeBordModuleTable.id, moduleId)
        )
      );

    if (result.rowCount === 0) {
      throw new NotFoundException(
        `Aucun module avec l'id ${tableauDeBordModuleTable.id} n'a été trouvé`
      );
    }
    this.logger.log(
      `Module ${moduleId} deleted for collectivite ${collectiviteId}`
    );
  }

  async get(
    request: GetTableauDeBordModuleRequestType,
    authUser: AuthUser | null
  ): Promise<CollectiviteModuleType> {
    if (authUser) {
      await this.permissionService.isAllowed(
        authUser,
        PermissionOperationEnum['COLLECTIVITES.VISITE'],
        ResourceType.COLLECTIVITE,
        request.collectiviteId
      );
    }

    const conditions: (SQLWrapper | SQL)[] = [
      eq(tableauDeBordModuleTable.collectiviteId, request.collectiviteId),
      isNull(tableauDeBordModuleTable.userId),
    ];

    if (request.defaultKey) {
      conditions.push(
        eq(tableauDeBordModuleTable.defaultKey, request.defaultKey)
      );
    }
    if (request.id) {
      conditions.push(eq(tableauDeBordModuleTable.id, request.id));
    }

    const data = (await this.databaseService.db
      .select()
      .from(tableauDeBordModuleTable)
      .where(and(...conditions))) as CollectiviteModuleType[];

    let module: CollectiviteModuleType | null = null;
    if (data.length) {
      module = data[0];
    } else if (request.defaultKey) {
      const planActionIds = (
        await this.planActionsService.list(request.collectiviteId)
      ).map((plan) => plan.id);
      module = await this.getDefaultModule(
        request.defaultKey,
        request.collectiviteId,
        planActionIds
      );
    }

    if (!module) {
      throw new NotFoundException(
        `Aucun module trouvé pour la collectivité ${request.collectiviteId} avec l'identifiant ${request.id} ou la clé par défaut ${request.defaultKey}.`
      );
    }

    return module;
  }

  private async mergeWithDefaultModules(
    collectiviteId: number,
    fetchedModules: CollectiviteModuleType[]
  ) {
    const planActionIds = (
      await this.planActionsService.list(collectiviteId)
    ).map((plan) => plan.id);

    // On crée une map des modules récupérés avec la defaultKey ou l'id (si pas module par défaut) comme clé
    const fetchedModulesMap = new Map(
      fetchedModules.map((module) => [module.defaultKey || module.id, module])
    );

    // On ajoute les modules par défaut non présents dans les modules récupérés
    for (const defaultKey of collectiviteDefaultModuleKeysSchema.options) {
      if (fetchedModulesMap.get(defaultKey)) {
        continue;
      }
      console.log('defaultKey', {
        defaultKey,
        collectiviteId,
        planActionIds,
      });
      const defaultModule = await this.getDefaultModule(
        defaultKey,
        collectiviteId,
        planActionIds
      );

      fetchedModulesMap.set(defaultKey, defaultModule);
    }

    // Ordonne manuellement les modules pour qu'ils apparaissent dans l'ordre voulu
    return Array.from(fetchedModulesMap.values()).sort((a, b) => {
      const moduleATypeIndex = collectiviteModuleEnumTypeSchema.options.indexOf(
        a.type
      );
      const moduleBTypeIndex = collectiviteModuleEnumTypeSchema.options.indexOf(
        b.type
      );
      if (moduleATypeIndex !== moduleBTypeIndex) {
        return moduleATypeIndex - moduleBTypeIndex;
      } else {
        const aCreationDate = DateTime.fromISO(a.createdAt);
        const bCreationDate = DateTime.fromISO(b.createdAt);
        return aCreationDate.toMillis() - bCreationDate.toMillis();
      }
    });
  }

  /**
   * Retourne le module de base par défaut correspondant à la clé donnée.
   */
  async getDefaultModule(
    key: string,
    collectiviteId: number,
    planActionIds: number[]
  ): Promise<CollectiviteModuleType> {
    if (
      key === collectiviteDefaultModuleKeysSchema.enum['suivi-plan-actions']
    ) {
      return {
        id: crypto.randomUUID(),
        userId: null,
        collectiviteId,
        titre: 'Suivi des plans', // Suivi des plans d’action
        type: 'plan-action.list',
        defaultKey: key,
        options: {
          page: 1,
          limit: 1000,
          filtre: {
            // Le filtre par défaut se base sur tous les plans d'actions de la collectivité
            planActionIds,
          },
        },
        createdAt: TableauDeBordCollectiviteService.DEFAULT_MODULE_SET_UP_DATE,
        modifiedAt: TableauDeBordCollectiviteService.DEFAULT_MODULE_SET_UP_DATE,
      };
    }

    if (
      key ===
      collectiviteDefaultModuleKeysSchema.enum['fiche-actions-par-statut']
    ) {
      return {
        id: crypto.randomUUID(),
        userId: null,
        collectiviteId,
        titre: 'Actions par statut', // Suivi de l'avancement des actions
        type: 'fiche-action.count-by',
        defaultKey: key,
        options: {
          countByProperty: 'statut',
          filtre: {
            // Le filtre par défaut se base sur tous les plans d'actions de la collectivité
            planActionIds,
          },
        },
        createdAt: TableauDeBordCollectiviteService.DEFAULT_MODULE_SET_UP_DATE,
        modifiedAt: TableauDeBordCollectiviteService.DEFAULT_MODULE_SET_UP_DATE,
      };
    }

    if (
      key ===
      collectiviteDefaultModuleKeysSchema.enum['fiche-actions-par-priorite']
    ) {
      return {
        id: crypto.randomUUID(),
        userId: null,
        collectiviteId,
        titre: 'Répartition par niveau de priorité',
        type: 'fiche-action.count-by',
        defaultKey: key,
        options: {
          countByProperty: 'priorite',
          filtre: {
            // Le filtre par défaut se base sur tous les plans d'actions de la collectivité
            planActionIds,
          },
        },
        createdAt: TableauDeBordCollectiviteService.DEFAULT_MODULE_SET_UP_DATE,
        modifiedAt: TableauDeBordCollectiviteService.DEFAULT_MODULE_SET_UP_DATE,
      };
    }

    if (
      key ===
      collectiviteDefaultModuleKeysSchema.enum[
        'fiche-actions-par-personne-pilote'
      ]
    ) {
      return {
        id: crypto.randomUUID(),
        userId: null,
        collectiviteId,
        titre: 'Répartition par personne pilote',
        type: 'fiche-action.count-by',
        defaultKey: key,
        options: {
          countByProperty: 'pilotes',
          filtre: {
            // Le filtre par défaut se base sur tous les plans d'actions de la collectivité
            planActionIds,
          },
        },
        createdAt: TableauDeBordCollectiviteService.DEFAULT_MODULE_SET_UP_DATE,
        modifiedAt: TableauDeBordCollectiviteService.DEFAULT_MODULE_SET_UP_DATE,
      };
    }

    if (
      key ===
      collectiviteDefaultModuleKeysSchema.enum[
        'fiche-actions-par-indicateurs-associes'
      ]
    ) {
      return {
        id: crypto.randomUUID(),
        collectiviteId,
        userId: null,
        titre: 'Actions et indicateurs associés',
        type: 'fiche-action.count-by',
        defaultKey: key,
        options: {
          countByProperty: 'indicateurs',
          filtre: {
            // Le filtre par défaut se base sur tous les plans d'actions de la collectivité
            planActionIds,
          },
        },
        createdAt: TableauDeBordCollectiviteService.DEFAULT_MODULE_SET_UP_DATE,
        modifiedAt: TableauDeBordCollectiviteService.DEFAULT_MODULE_SET_UP_DATE,
      };
    }
    console.log('key', key, { collectiviteId, planActionIds });
    throw new Error(
      `La clé ${key} n'est pas une clé de module par défaut?????????,.`
    );
  }
}
