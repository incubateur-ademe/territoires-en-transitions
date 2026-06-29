import { ForbiddenException, Injectable, Logger } from '@nestjs/common';
import { tableauDeBordModuleTable } from '@tet/backend/collectivites/tableau-de-bord/tableau-de-bord-module.table';
import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import {
  ModuleInsert,
  ModuleSelect,
  parseModuleFromDb,
  PersonalDefaultModuleKeys,
  personalDefaultModuleKeysSchema,
  prepareModuleForPersistence,
} from '@tet/domain/collectivites/tableau-de-bord';
import { PermissionOperationEnum, ResourceType } from '@tet/domain/users';
import { and, eq, sql } from 'drizzle-orm';
import { DateTime } from 'luxon';
import { objectToCamel } from 'ts-case-convert';

@Injectable()
export class TableauDeBordPersonnelService {
  private readonly logger = new Logger(TableauDeBordPersonnelService.name);

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly permissionService: PermissionService
  ) {}

  /**
   * Fetch les modules du tableau de bord personnel d'un user pour une collectivité.
   */
  async list(
    collectiviteId: number,
    authUser: AuthenticatedUser
  ): Promise<ModuleSelect[]> {
    await this.permissionService.isAllowed(
      authUser,
      'collectivites.read',
      ResourceType.COLLECTIVITE,
      collectiviteId
    );

    const rawData = await this.databaseService.db
      .select()
      .from(tableauDeBordModuleTable)
      .where(
        and(
          eq(tableauDeBordModuleTable.collectiviteId, collectiviteId),
          eq(tableauDeBordModuleTable.userId, authUser.id)
        )
      );

    const fetchedModules = rawData.map((module) => this.parseRawModule(module));

    this.logger.log(
      `Personal modules fetched for collectivite ${collectiviteId} and user ${authUser.id}: ${fetchedModules.length}`
    );

    return this.mergeWithDefaultModules(
      collectiviteId,
      authUser.id,
      fetchedModules
    );
  }

  /**
   * Fetch un module spécifique du tableau de bord personnel d'un user.
   * Retourne le module par défaut si aucun module personnalisé n'est enregistré.
   */
  async get(
    collectiviteId: number,
    defaultKey: PersonalDefaultModuleKeys,
    authUser: AuthenticatedUser
  ): Promise<ModuleSelect> {
    await this.permissionService.isAllowed(
      authUser,
      'collectivites.read',
      ResourceType.COLLECTIVITE,
      collectiviteId
    );

    const rawData = await this.databaseService.db
      .select()
      .from(tableauDeBordModuleTable)
      .where(
        and(
          eq(tableauDeBordModuleTable.collectiviteId, collectiviteId),
          eq(tableauDeBordModuleTable.userId, authUser.id),
          eq(tableauDeBordModuleTable.defaultKey, defaultKey)
        )
      )
      .limit(1);

    if (rawData.length) {
      return this.parseRawModule(rawData[0]);
    }

    return this.getDefaultModule(defaultKey, collectiviteId, authUser.id);
  }

  /**
   * Crée ou met à jour un module du tableau de bord personnel de l'utilisateur
   * courant.
   *
   * Un module personnel appartient toujours à l'utilisateur courant : on force
   * le `userId` et on interdit la modification d'un module appartenant à un
   * autre utilisateur (cf. RLS `allow_update`).
   */
  async upsert(
    module: ModuleInsert,
    authUser: AuthenticatedUser
  ): Promise<ModuleSelect> {
    await this.permissionService.isAllowed(
      authUser,
      PermissionOperationEnum['COLLECTIVITES.TABLEAU-DE-BORD-PERSONNEL.MUTATE'],
      ResourceType.COLLECTIVITE,
      module.collectiviteId
    );

    // Retire page/limit des options avant persistance (gérés par le schéma Zod
    // au moment du fetch).
    const preparedModule = prepareModuleForPersistence(module);

    // Empêche d'écraser le module d'un autre utilisateur via un id usurpé.
    const existing = await this.databaseService.db
      .select({ userId: tableauDeBordModuleTable.userId })
      .from(tableauDeBordModuleTable)
      .where(eq(tableauDeBordModuleTable.id, preparedModule.id))
      .limit(1);

    if (existing.length && existing[0].userId !== authUser.id) {
      throw new ForbiddenException(
        `Droits insuffisants, le module ${preparedModule.id} appartient à un autre utilisateur.`
      );
    }

    const [upsertedModule] = await this.databaseService.db
      .insert(tableauDeBordModuleTable)
      .values({
        ...preparedModule,
        userId: authUser.id,
      })
      .onConflictDoUpdate({
        target: [tableauDeBordModuleTable.id],
        set: {
          titre: sql.raw(`excluded.${tableauDeBordModuleTable.titre.name}`),
          options: sql.raw(`excluded.${tableauDeBordModuleTable.options.name}`),
        },
      })
      .returning();

    this.logger.log(
      `Personal module ${upsertedModule.id} upserted for collectivite ${upsertedModule.collectiviteId} and user ${authUser.id}`
    );

    return this.parseRawModule(upsertedModule);
  }

  private mergeWithDefaultModules(
    collectiviteId: number,
    userId: string,
    fetchedModules: ModuleSelect[]
  ): ModuleSelect[] {
    // On crée une map des modules récupérés avec la clé ou l'id (si pas module par défaut) comme clé
    const fetchedModulesMap = new Map(
      fetchedModules.map((module) => [module.defaultKey || module.id, module])
    );

    // On ajoute les modules par défaut non présents dans les modules récupérés
    for (const defaultKey of personalDefaultModuleKeysSchema.options) {
      if (fetchedModulesMap.get(defaultKey)) {
        continue;
      }

      fetchedModulesMap.set(
        defaultKey,
        this.getDefaultModule(defaultKey, collectiviteId, userId)
      );
    }

    return [
      fetchedModulesMap.get(
        personalDefaultModuleKeysSchema.enum['indicateurs-dont-je-suis-pilote']
      ) as ModuleSelect,
      fetchedModulesMap.get(
        personalDefaultModuleKeysSchema.enum['actions-dont-je-suis-pilote']
      ) as ModuleSelect,
      fetchedModulesMap.get(
        personalDefaultModuleKeysSchema.enum['sous-actions-dont-je-suis-pilote']
      ) as ModuleSelect,
      fetchedModulesMap.get(
        personalDefaultModuleKeysSchema.enum['mesures-dont-je-suis-pilote']
      ) as ModuleSelect,
    ];
  }

  /**
   * Retourne le module de base par défaut correspondant à la clé donnée.
   */
  getDefaultModule(
    defaultKey: PersonalDefaultModuleKeys,
    collectiviteId: number,
    userId: string
  ): ModuleSelect {
    const now = new Date().toISOString();

    if (
      defaultKey ===
      personalDefaultModuleKeysSchema.enum['actions-dont-je-suis-pilote']
    ) {
      return parseModuleFromDb({
        id: crypto.randomUUID(),
        userId,
        collectiviteId,
        titre: 'Actions dont je suis le pilote',
        type: 'fiche_action.list',
        defaultKey,
        options: {
          filtre: {
            utilisateurPiloteIds: [userId],
          },
        },
        createdAt: now,
        modifiedAt: now,
      });
    }

    if (
      defaultKey ===
      personalDefaultModuleKeysSchema.enum['sous-actions-dont-je-suis-pilote']
    ) {
      return parseModuleFromDb({
        id: crypto.randomUUID(),
        userId,
        collectiviteId,
        titre: 'Sous actions pilotées',
        type: 'fiche_action.list',
        defaultKey,
        options: {
          filtre: {
            utilisateurPiloteIds: [userId],
            onlyChildren: true,
          },
        },
        createdAt: now,
        modifiedAt: now,
      });
    }

    if (
      defaultKey ===
      personalDefaultModuleKeysSchema.enum['indicateurs-dont-je-suis-pilote']
    ) {
      return parseModuleFromDb({
        id: crypto.randomUUID(),
        userId,
        collectiviteId,
        titre: 'Indicateurs dont je suis le pilote',
        type: 'indicateur.list',
        defaultKey,
        options: {
          filtre: {
            utilisateurPiloteIds: [userId],
          },
        },
        createdAt: now,
        modifiedAt: now,
      });
    }

    if (
      defaultKey ===
      personalDefaultModuleKeysSchema.enum['mesures-dont-je-suis-pilote']
    ) {
      return parseModuleFromDb({
        id: crypto.randomUUID(),
        userId,
        collectiviteId,
        titre: 'Mesures des référentiels dont je suis le pilote',
        type: 'mesure.list',
        defaultKey,
        options: {
          filtre: {
            utilisateurPiloteIds: [userId],
          },
        },
        createdAt: now,
        modifiedAt: now,
      });
    }

    throw new Error(
      `La clé ${defaultKey} n'est pas une clé de module par défaut.`
    );
  }

  /**
   * Transforme une ligne brute de la BDD en `ModuleSelect`.
   *
   * Les modules désormais enregistrés via `upsert` stockent un jsonb `options` en
   * camelCase. En revanche, les modules persistés historiquement via le client
   * Supabase (`objectToSnake`) ont des clés en snake_case (ex:
   * `utilisateur_pilote_ids`). On repasse systématiquement les options en
   * camelCase (idempotent) avant le parse Zod, sinon le filtre serait ignoré.
   */
  private parseRawModule(rawModule: {
    options: unknown;
    createdAt: string;
    modifiedAt: string;
  }): ModuleSelect {
    const normalized = this.normalizeDates(rawModule);
    return parseModuleFromDb({
      ...normalized,
      options: objectToCamel(
        (normalized.options ?? {}) as Record<string, unknown>
      ),
    });
  }

  /**
   * Convertit les dates de la BDD au format ISO (UTC, suffixe `Z`) attendu par
   * le schéma Zod. Postgres renvoie des timestamps du type
   * `2024-10-16 12:00:00+00` que `new Date(...)` ne sait pas parser (offset sur
   * 2 chiffres), d'où l'utilisation de Luxon (plus permissif).
   */
  private normalizeDates<T extends { createdAt: string; modifiedAt: string }>(
    module: T
  ): T {
    return {
      ...module,
      createdAt: this.toIsoUtc(module.createdAt),
      modifiedAt: this.toIsoUtc(module.modifiedAt),
    };
  }

  private toIsoUtc(value: string): string {
    const dateTime = DateTime.fromISO(value.replace(' ', 'T'), {
      setZone: true,
    });
    if (!dateTime.isValid) {
      throw new Error(`Date invalide reçue de la BDD: "${value}"`);
    }
    return dateTime.toUTC().toJSDate().toISOString();
  }
}
