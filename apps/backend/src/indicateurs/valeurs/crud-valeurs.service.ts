import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
} from '@nestjs/common';
import CollectivitesService from '@tet/backend/collectivites/services/collectivites.service';
import { UpdateDefinitionService } from '@tet/backend/indicateurs/definitions/mutate-definition/update-definition.service';
import ComputeValeursService from '@tet/backend/indicateurs/valeurs/compute-valeurs.service';
import { DEFAULT_ROUNDING_PRECISION } from '@tet/backend/indicateurs/valeurs/valeurs.constants';
import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import {
  IndicateurDefinition,
  IndicateurValeur,
  IndicateurValeurAvecMetadonnesDefinition,
  IndicateurValeurCreate,
  IndicateurValeurWithIdentifiant,
} from '@tet/domain/indicateurs';
import {
  hasPermission,
  PermissionOperationEnum,
  ResourceType,
} from '@tet/domain/users';
import { getErrorMessage } from '@tet/domain/utils';
import {
  and,
  eq,
  inArray,
  isNotNull,
  isNull,
  or,
  sql,
  SQL,
  SQLWrapper,
} from 'drizzle-orm';
import { chunk, isNil, isNotNil, keyBy, partition, round } from 'es-toolkit';
import { GetUserRolesAndPermissionsService } from '../../users/authorizations/get-user-roles-and-permissions/get-user-roles-and-permissions.service';
import {
  AuthenticatedUser,
  AuthRole,
  AuthUser,
} from '../../users/models/auth.models';
import { DatabaseService } from '../../utils/database/database.service';
import { indicateurDefinitionTable } from '../definitions/indicateur-definition.table';
import { ListCollectiviteDefinitionsRepository } from '../definitions/list-collectivite-definitions/list-collectivite-definitions.repository';
import { ListPlatformDefinitionsRepository } from '../definitions/list-platform-definitions/list-platform-definitions.repository';
import { IndicateurListItem } from '../indicateurs/list-indicateurs/list-indicateurs.output';
import { ListIndicateursService } from '../indicateurs/list-indicateurs/list-indicateurs.service';
import { DeleteIndicateursValeursRequestType } from './delete-indicateur-valeurs.request';
import { DeleteValeurIndicateur } from './delete-valeur-indicateur.request';
import { GetIndicateursValeursResponse } from './get-indicateur-valeurs.response';
import { indicateurValeurTable } from './indicateur-valeur.table';
import {
  deduplicateIndicateurValeursBySource,
  groupIndicateurValeurs,
  groupIndicateurValeursBySource,
} from './indicateur-valeurs-read.adapter';
import { getIndicateurValeursDataOrThrow } from './indicateur-valeurs.errors';
import { ListIndicateurValeursInput } from './list-indicateur-valeurs.input';
import { ListIndicateurValeursService } from './list-indicateur-valeurs.service';
import { UpsertValeurIndicateur } from './upsert-valeur-indicateur.request';

type IndicateurValeurInsert = IndicateurValeurCreate;

@Injectable()
export default class CrudValeursService {
  private readonly logger = new Logger(CrudValeursService.name);

  public readonly UNKOWN_SOURCE_ID = 'unknown';

  private readonly PARALLEL_COLLECTIVITE_COMPUTE_VALEURS = 1;

  /**
   * Number of decimal in order to round the value
   */
  static DEFAULT_ROUNDING_PRECISION = DEFAULT_ROUNDING_PRECISION;

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly permissionService: PermissionService,
    private readonly getUserPermissionsService: GetUserRolesAndPermissionsService,
    private readonly collectiviteService: CollectivitesService,
    private readonly listCollectiviteDefinitionsRepository: ListCollectiviteDefinitionsRepository,
    private readonly listPlatformDefinitionsRepository: ListPlatformDefinitionsRepository,
    private readonly listIndicateursService: ListIndicateursService,
    private readonly updateIndicateurService: UpdateDefinitionService,
    private readonly computeValeursService: ComputeValeursService,
    private readonly reader: ListIndicateurValeursService
  ) {}
  async getIndicateursValeurs(
    options: ListIndicateurValeursInput,
    ignoreDedoublonnage?: boolean,
    tx?: Transaction
  ): Promise<IndicateurValeurAvecMetadonnesDefinition[]> {
    return getIndicateurValeursDataOrThrow(
      await this.reader.get(
        { ...options, ignoreDedoublonnage },
        { isUserTrusted: true, tx }
      )
    );
  }

  async deleteIndicateurValeurs(options: DeleteIndicateursValeursRequestType) {
    this.logger.log(
      `Suppression des valeurs des indicateurs selon ces options : ${JSON.stringify(
        options
      )}`
    );

    const conditions: (SQLWrapper | SQL)[] = [
      eq(indicateurValeurTable.collectiviteId, options.collectiviteId),
    ];
    if (options.indicateurId) {
      conditions.push(
        eq(indicateurValeurTable.indicateurId, options.indicateurId)
      );
    }
    if (options.metadonneeId) {
      conditions.push(
        eq(indicateurValeurTable.metadonneeId, options.metadonneeId)
      );
    }

    const deleteQuery = this.databaseService.db
      .delete(indicateurValeurTable)
      .where(and(...conditions));

    const deletedIds = await deleteQuery.returning({
      id: indicateurValeurTable.id,
    });
    this.logger.log(
      `${deletedIds.length} valeurs d'indicateurs ont été supprimées`
    );
    return { indicateurValeurIdsSupprimes: deletedIds };
  }
  async listIndicateurValeurs(
    options: ListIndicateurValeursInput,
    user?: AuthUser
  ): Promise<GetIndicateursValeursResponse> {
    return getIndicateurValeursDataOrThrow(
      await this.reader.list(options, user ? { user } : { isUserTrusted: true })
    );
  }

  async canMutateValeur(
    user: AuthenticatedUser,
    collectiviteId: number,
    indicateur: IndicateurListItem
  ): Promise<boolean> {
    const userPermissionsResult =
      await this.getUserPermissionsService.getUserRolesAndPermissions({
        userId: user.id,
      });

    if (!userPermissionsResult.success) {
      throw new ForbiddenException(
        `Droits insuffisants, l'utilisateur ${user.id} n'a pas les droits pour muter la valeur de l'indicateur ${indicateur.id} de la collectivité ${collectiviteId}`
      );
    }

    const userPermissions = userPermissionsResult.data;

    if (
      hasPermission(userPermissions, 'indicateurs.valeurs.mutate', {
        collectiviteId,
      })
    ) {
      return true;
    }

    if (
      hasPermission(
        userPermissions,
        'indicateurs.valeurs.mutate_piloted_by_me',
        { collectiviteId }
      ) &&
      indicateur.pilotes?.some((p) => p.userId === user.id)
    ) {
      return true;
    }

    this.permissionService.throwForbiddenException(
      user,
      'indicateurs.valeurs.mutate',
      ResourceType.COLLECTIVITE,
      { collectiviteId }
    );

    return false;
  }

  /**
   * Variante de `upsertIndicateurValeurs` qui permet de ne pas être obligé de
   * redonner l'objet complet sans pour autant écraser la valeur existante. Et
   * donc de mettre à jour la colonne resultat indépendamment de la valeur
   * objectif (et pareil pour les commentaires).
   */
  async upsertValeur(data: UpsertValeurIndicateur, user: AuthenticatedUser) {
    const { collectiviteId, indicateurId } = data;

    const indicateur = await this.listIndicateursService.getIndicateur({
      collectiviteId,
      indicateurId,
    });

    await this.canMutateValeur(user, collectiviteId, indicateur);

    this.logger.log(`Upsert valeur with data ${JSON.stringify(data)}`);

    if (user.role === AuthRole.AUTHENTICATED && user.id) {
      if (!isNil(data.resultat)) {
        data.resultat = round(data.resultat, indicateur.precision);
      }
      if (!isNil(data.objectif)) {
        data.objectif = round(data.objectif, indicateur.precision);
      }

      const now = new Date().toISOString();
      let upsertedIndicateurValeur: IndicateurValeur | undefined = undefined;
      if (!isNil(data.id)) {
        this.logger.log(
          `Mise à jour de la valeur id ${data.id} pour la collectivité ${data.collectiviteId}`
        );
        const updated = await this.databaseService.db
          .update(indicateurValeurTable)
          .set({
            resultat: data.resultat,
            resultatCommentaire: data.resultatCommentaire,
            objectif: data.objectif,
            objectifCommentaire: data.objectifCommentaire,
            modifiedBy: user.id,
            modifiedAt: now,
          })
          .where(
            and(
              eq(indicateurValeurTable.collectiviteId, collectiviteId),
              eq(indicateurValeurTable.indicateurId, indicateurId),
              eq(indicateurValeurTable.id, data.id),
              isNull(indicateurValeurTable.metadonneeId)
            )
          )
          .returning();
        upsertedIndicateurValeur = updated[0];
      } else if (!isNil(data.dateValeur)) {
        this.logger.log(
          `Insertion de la valeur de l'indicateur ${data.indicateurId} pour la collectivité ${data.collectiviteId}`
        );

        try {
          const inserted = await this.databaseService.db
            .insert(indicateurValeurTable)
            .values({
              collectiviteId,
              indicateurId: data.indicateurId,
              dateValeur: data.dateValeur,
              resultat: data.resultat,
              resultatCommentaire: data.resultatCommentaire,
              objectif: data.objectif,
              objectifCommentaire: data.objectifCommentaire,
              createdBy: user.id,
              createdAt: now,
              modifiedBy: user.id,
              modifiedAt: now,
              metadonneeId: null,
            })
            .onConflictDoUpdate({
              target: [
                indicateurValeurTable.indicateurId,
                indicateurValeurTable.collectiviteId,
                indicateurValeurTable.dateValeur,
              ],
              targetWhere: isNull(indicateurValeurTable.metadonneeId),
              set: {
                resultat: data.resultat,
                resultatCommentaire: data.resultatCommentaire,
                objectif: data.objectif,
                objectifCommentaire: data.objectifCommentaire,
                modifiedBy: user.id,
                modifiedAt: now,
              },
            })
            .returning();

          upsertedIndicateurValeur = inserted[0];
        } catch (error) {
          this.logger.error(
            `Error d'insert de la valeur pour la collectivité ${collectiviteId} et l'indicateur ${
              data.indicateurId
            } et la date ${data.dateValeur} : ${getErrorMessage(error)}`
          );
          throw error;
        }
      }

      if (upsertedIndicateurValeur) {
        const calculatedIndicateurValeurToUpsert =
          await this.computeValeursService.updateCalculatedIndicateurValeurs(
            [upsertedIndicateurValeur],
            [indicateur]
          );
        this.logger.log(
          `${calculatedIndicateurValeurToUpsert.length} valeurs d'indicateurs calculées`
        );
        // WARNING : can recursively call updateCalculatedIndicateurValeurs if the computed indicateur valeur allows to calcule oher ones
        await this.upsertIndicateurValeurs(
          calculatedIndicateurValeurToUpsert,
          undefined
        );
      }

      // update indicateur definition modifiedBy field
      await this.updateIndicateurService.updateDefinitionModifiedFields({
        indicateurId: indicateur.id,
        collectiviteId,
        user,
      });

      return upsertedIndicateurValeur;
    }
  }

  async deleteValeurIndicateur(
    data: DeleteValeurIndicateur,
    user: AuthenticatedUser
  ) {
    const { collectiviteId, indicateurId, id } = data;

    const indicateur = await this.listIndicateursService.getIndicateur({
      indicateurId,
      collectiviteId,
    });

    await this.canMutateValeur(user, collectiviteId, indicateur);

    if (user.role === AuthRole.AUTHENTICATED && user.id) {
      await this.databaseService.db
        .delete(indicateurValeurTable)
        .where(
          and(
            eq(indicateurValeurTable.collectiviteId, collectiviteId),
            eq(indicateurValeurTable.indicateurId, indicateurId),
            eq(indicateurValeurTable.id, id)
          )
        );
    }

    // update indicateur definition modifiedBy field
    await this.updateIndicateurService.updateDefinitionModifiedFields({
      indicateurId,
      collectiviteId,
      user,
    });
  }

  async upsertIndicateurValeurs(
    indicateurValeurs: IndicateurValeurInsert[],
    user: AuthenticatedUser | undefined
  ): Promise<IndicateurValeurWithIdentifiant[]> {
    const collectiviteIds = [
      ...new Set(indicateurValeurs.map((v) => v.collectiviteId)),
    ];
    if (user) {
      for (const collectiviteId of collectiviteIds) {
        await this.permissionService.assertAllowed(
          user,
          PermissionOperationEnum['INDICATEURS.VALEURS.MUTATE'],
          ResourceType.COLLECTIVITE,
          { collectiviteId }
        );
      }

      if (user.role === AuthRole.AUTHENTICATED && user.id) {
        indicateurValeurs.forEach((v) => {
          v.createdBy = user.id;
          v.modifiedBy = user.id;
        });
      }
    }

    this.logger.log(
      `Upsert des ${indicateurValeurs.length} valeurs des indicateurs pour l'utilisateur ${user?.id} (role ${user?.role})`
    );

    // Retrieve indicateur definition to be able to round values
    const indicateurIds = [
      ...new Set(indicateurValeurs.map((v) => v.indicateurId)),
    ];
    const indicateurDefinitions =
      await this.listCollectiviteDefinitionsRepository.listCollectiviteDefinitions(
        { indicateurIds }
      );
    const indicateurDefinitionsById = keyBy(
      indicateurDefinitions,
      (item) => item.id
    );
    // Round values for each record
    indicateurValeurs.forEach((v) => {
      const definition = indicateurDefinitionsById[v.indicateurId];
      if (definition) {
        v.resultat = isNotNil(v.resultat)
          ? round(v.resultat, definition.precision)
          : null;
        v.objectif = isNotNil(v.objectif)
          ? round(v.objectif, definition.precision)
          : null;
      } else {
        throw new BadRequestException(
          `Indicateur definition not found for id ${v.indicateurId}`
        );
      }
    });

    // On doit distinguer les valeurs avec et sans métadonnées car la clause d'unicité est différente (onConflictDoUpdate)
    const [indicateurValeursAvecMetadonnees, indicateurValeursSansMetadonnees] =
      partition(indicateurValeurs, (v) => Boolean(v.metadonneeId));
    const indicateurValeursResultat: IndicateurValeurWithIdentifiant[] = [];
    if (indicateurValeursAvecMetadonnees.length) {
      this.logger.log(
        `Upsert des ${
          indicateurValeursAvecMetadonnees.length
        } valeurs avec métadonnées des indicateurs ${[
          ...new Set(
            indicateurValeursAvecMetadonnees.map((v) => v.indicateurId)
          ),
        ].join(',')} pour les collectivités ${[
          ...new Set(
            indicateurValeursAvecMetadonnees.map((v) => v.collectiviteId)
          ),
        ].join(',')}`
      );
      try {
        const indicateurValeursAvecMetadonneesResultat =
          await this.databaseService.db
            .insert(indicateurValeurTable)
            .values(indicateurValeursAvecMetadonnees)
            .onConflictDoUpdate({
              target: [
                indicateurValeurTable.indicateurId,
                indicateurValeurTable.collectiviteId,
                indicateurValeurTable.dateValeur,
                indicateurValeurTable.metadonneeId,
              ],
              targetWhere: isNotNull(indicateurValeurTable.metadonneeId),
              set: {
                resultat: sql.raw(
                  `excluded.${indicateurValeurTable.resultat.name}`
                ),
                resultatCommentaire: sql.raw(
                  `excluded.${indicateurValeurTable.resultatCommentaire.name}`
                ),
                objectif: sql.raw(
                  `excluded.${indicateurValeurTable.objectif.name}`
                ),
                objectifCommentaire: sql.raw(
                  `excluded.${indicateurValeurTable.objectifCommentaire.name}`
                ),
                calculAuto: sql.raw(
                  `excluded.${indicateurValeurTable.calculAuto.name}`
                ),
                calculAutoIdentifiantsManquants: sql.raw(
                  `excluded.${indicateurValeurTable.calculAutoIdentifiantsManquants.name}`
                ),
                modifiedBy: sql.raw(
                  `excluded.${indicateurValeurTable.modifiedBy.name}`
                ),
              },
            })
            .returning();
        indicateurValeursResultat.push(
          ...indicateurValeursAvecMetadonneesResultat
        );
      } catch (e) {
        this.logger.error(
          `Erreur lors de l'upsert des valeurs avec métadonnées pour les collectivités ${collectiviteIds} : ${getErrorMessage(
            e
          )}`
        );
        this.logger.log(
          `Données en erreur : ${JSON.stringify(
            indicateurValeursAvecMetadonnees
          )}`
        );
        throw e;
      }
    }

    if (indicateurValeursSansMetadonnees.length) {
      let indicateurValeursSansMetadonneesToInsert: IndicateurValeurInsert[] =
        indicateurValeursSansMetadonnees;

      // Vérifie si les données à insérer sont autocalculées, si c'est le cas, on ne doit pas écraser les données des collectivités saisies manuellement
      const indicateurValeursAutocalculees =
        indicateurValeursSansMetadonneesToInsert.filter((v) => v.calculAuto);
      if (indicateurValeursAutocalculees.length) {
        const indicateurValeursAutocalculeesConditions: (
          | SQLWrapper
          | undefined
        )[] = [];
        indicateurValeursAutocalculees.forEach((v) => {
          indicateurValeursAutocalculeesConditions.push(
            and(
              eq(indicateurValeurTable.indicateurId, v.indicateurId),
              eq(indicateurValeurTable.collectiviteId, v.collectiviteId),
              eq(indicateurValeurTable.dateValeur, v.dateValeur),
              isNull(indicateurValeurTable.metadonneeId),
              or(
                isNull(indicateurValeurTable.calculAuto),
                eq(indicateurValeurTable.calculAuto, false)
              )
            )
          );
        });

        const valeursSaisiesManuellementExistantes =
          await this.databaseService.db
            .select()
            .from(indicateurValeurTable)
            .where(or(...indicateurValeursAutocalculeesConditions));

        this.logger.log(
          `${valeursSaisiesManuellementExistantes.length} valeurs saisies manuellement existantes pour les indicateurs`
        );

        if (valeursSaisiesManuellementExistantes.length) {
          indicateurValeursSansMetadonneesToInsert =
            indicateurValeursSansMetadonneesToInsert.filter((v) => {
              const valeurSaisiesManuellementExistante =
                valeursSaisiesManuellementExistantes.find(
                  (v2) =>
                    v2.indicateurId === v.indicateurId &&
                    v2.collectiviteId === v.collectiviteId &&
                    v2.dateValeur === v.dateValeur
                );
              return !valeurSaisiesManuellementExistante;
            });
          this.logger.log(
            `${indicateurValeursSansMetadonneesToInsert.length} valeurs à insérer après filtrage des données saisies manuellement`
          );
        }
      }
      if (indicateurValeursSansMetadonneesToInsert.length) {
        try {
          this.logger.log(
            `Upsert des ${
              indicateurValeursSansMetadonneesToInsert.length
            } valeurs sans métadonnées des indicateurs ${[
              ...new Set(
                indicateurValeursSansMetadonneesToInsert.map(
                  (v) => v.indicateurId
                )
              ),
            ].join(',')} pour les collectivités ${[
              ...new Set(
                indicateurValeursSansMetadonneesToInsert.map(
                  (v) => v.collectiviteId
                )
              ),
            ].join(',')}`
          );

          const indicateurValeursSansMetadonneesResultat =
            await this.databaseService.db
              .insert(indicateurValeurTable)
              .values(indicateurValeursSansMetadonneesToInsert)
              .onConflictDoUpdate({
                target: [
                  indicateurValeurTable.indicateurId,
                  indicateurValeurTable.collectiviteId,
                  indicateurValeurTable.dateValeur,
                ],
                targetWhere: isNull(indicateurValeurTable.metadonneeId),
                set: {
                  resultat: sql.raw(
                    `excluded.${indicateurValeurTable.resultat.name}`
                  ),
                  resultatCommentaire: sql.raw(
                    `excluded.${indicateurValeurTable.resultatCommentaire.name}`
                  ),
                  objectif: sql.raw(
                    `excluded.${indicateurValeurTable.objectif.name}`
                  ),
                  objectifCommentaire: sql.raw(
                    `excluded.${indicateurValeurTable.objectifCommentaire.name}`
                  ),
                  calculAuto: sql.raw(
                    `excluded.${indicateurValeurTable.calculAuto.name}`
                  ),
                  calculAutoIdentifiantsManquants: sql.raw(
                    `excluded.${indicateurValeurTable.calculAutoIdentifiantsManquants.name}`
                  ),
                  modifiedBy: sql.raw(
                    `excluded.${indicateurValeurTable.modifiedBy.name}`
                  ),
                },
              })
              .returning();
          indicateurValeursResultat.push(
            ...indicateurValeursSansMetadonneesResultat
          );
        } catch (e) {
          this.logger.error(
            `Erreur lors de l'upsert des valeurs sans métadonnées pour les collectivités ${collectiviteIds} : ${getErrorMessage(
              e
            )}`
          );
          this.logger.log(
            `Données en erreur : ${JSON.stringify(
              indicateurValeursSansMetadonneesToInsert
            )}`
          );
          throw e;
        }
      }
    }
    indicateurValeursResultat.forEach((v) => {
      if (
        !v.indicateurIdentifiant &&
        indicateurDefinitionsById[`${v.indicateurId}`]
      ) {
        v.indicateurIdentifiant =
          indicateurDefinitionsById[`${v.indicateurId}`].identifiantReferentiel;
      }
    });

    if (indicateurValeursResultat.length) {
      const calculatedIndicateursResultatToUpsert =
        await this.computeValeursService.updateCalculatedIndicateurValeurs(
          indicateurValeursResultat
        );
      this.logger.log(
        `${calculatedIndicateursResultatToUpsert.length} valeurs d'indicateurs calculées`
      );

      const calculatedIndicateurValeur: IndicateurValeurWithIdentifiant[] =
        calculatedIndicateursResultatToUpsert.length
          ? await this.upsertIndicateurValeurs(
              calculatedIndicateursResultatToUpsert,
              undefined
            )
          : [];

      indicateurValeursResultat.push(...calculatedIndicateurValeur);
    }

    return indicateurValeursResultat;
  }

  async recomputeAllCalculatedIndicateurValeurs(
    onlyForCollectiviteId: number | undefined,
    user: AuthUser | null,
    forComputedIndicateurDefinitions?: IndicateurDefinition[],
    doNotCheckRights?: boolean
  ) {
    // Check if the user has the permission to recompute all calculated indicateur valeurs
    if (!doNotCheckRights) {
      this.permissionService.hasServiceRole(user);
    }

    if (!forComputedIndicateurDefinitions) {
      forComputedIndicateurDefinitions =
        await this.listPlatformDefinitionsRepository.listPlatformDefinitionsHavingComputedValue();
    }
    this.logger.log(
      `Recompute all calculated indicateur valeurs for collectivite ${
        onlyForCollectiviteId || 'all'
      } and identifiants ${forComputedIndicateurDefinitions
        .map((d) => d.identifiantReferentiel)
        .join(',')}`
    );

    const allSourceIdentifiants =
      await this.computeValeursService.getAllSourceIdentifiants(
        forComputedIndicateurDefinitions
      );

    const allowedExtraSourcesForCalculatedValeurs =
      await this.computeValeursService.getSourcesCalcul();

    // Identify all collectivites which have some values for these source identifiants

    const collectiviteIds = onlyForCollectiviteId
      ? [onlyForCollectiviteId]
      : (
          await this.databaseService.db
            .selectDistinct({ id: indicateurValeurTable.collectiviteId })
            .from(indicateurValeurTable)
            .leftJoin(
              indicateurDefinitionTable,
              eq(
                indicateurValeurTable.indicateurId,
                indicateurDefinitionTable.id
              )
            )
            .where(
              inArray(
                indicateurDefinitionTable.identifiantReferentiel,
                allSourceIdentifiants
              )
            )
        ).map((c) => c.id);

    const allComputedIndicateurValeurs: {
      collectiviteId: number;
      valeursCount: number;
      identifiants: string[];
    }[] = [];
    const collectiviteIdsChunks = chunk(
      collectiviteIds,
      this.PARALLEL_COLLECTIVITE_COMPUTE_VALEURS
    );
    this.logger.log(
      `Found ${collectiviteIds.length} collectivites with values for these source indicateur identifiants (${collectiviteIdsChunks.length} chunks of ${this.PARALLEL_COLLECTIVITE_COMPUTE_VALEURS} collectivites)`
    );

    const recomputeResult: Promise<{
      collectiviteId: number;
      valeursCount: number;
      identifiants: string[];
    }>[] = [];
    let totalComputedIndicateurValeursCount = 0;
    let iChunk = 0;
    for (const collectiviteIdsChunk of collectiviteIdsChunks) {
      collectiviteIdsChunk.forEach((collectiviteId) => {
        recomputeResult.push(
          this.recomputeCollectiviteCalculatedIndicateurValeurs(
            collectiviteId,
            forComputedIndicateurDefinitions,
            allSourceIdentifiants,
            allowedExtraSourcesForCalculatedValeurs
          )
        );
      });
      const computedIndicateurValeurs = await Promise.all(recomputeResult);
      allComputedIndicateurValeurs.push(...computedIndicateurValeurs);
      computedIndicateurValeurs.forEach((result) => {
        totalComputedIndicateurValeursCount += result.valeursCount;
      });
      iChunk++;
      this.logger.log(
        `Computed ${totalComputedIndicateurValeursCount} indicateur valeurs for ${iChunk}/${collectiviteIdsChunks.length} collectivite chunks`
      );
      recomputeResult.length = 0;
    }

    this.logger.log(
      `${totalComputedIndicateurValeursCount} recomputed indicateur valeurs`
    );

    return allComputedIndicateurValeurs;
  }

  private async recomputeCollectiviteCalculatedIndicateurValeurs(
    collectiviteId: number,
    computedIndicateurDefinitions: IndicateurDefinition[] | undefined,
    sourceIdentifiants: string[],
    allowedExtraSourcesForCalculatedValues: {
      sourceId: string;
      sourceCalculIds: string[];
    }[]
  ) {
    this.logger.log(
      `Recompute calculated indicateur valeurs for collectivite ${collectiviteId}`
    );

    if (!computedIndicateurDefinitions) {
      computedIndicateurDefinitions =
        await this.listPlatformDefinitionsRepository.listPlatformDefinitionsHavingComputedValue();
    }

    const computedIndicateurValeurs =
      await this.computeValeursService.recomputeCollectiviteCalculatedIndicateurValeurs(
        collectiviteId,
        computedIndicateurDefinitions,
        sourceIdentifiants,
        allowedExtraSourcesForCalculatedValues
      );

    // WARNING : can recursively call updateCalculatedIndicateurValeurs if the computed indicateur valeur allows to calcule oher ones
    const insertedIndicateurValeurs: IndicateurValeurWithIdentifiant[] =
      computedIndicateurValeurs.length
        ? await this.upsertIndicateurValeurs(
            computedIndicateurValeurs,
            undefined
          )
        : [];
    const insertedIndicateurValeurIdentifiants = [
      ...new Set(
        insertedIndicateurValeurs
          .map((v) => v.indicateurIdentifiant)
          .filter((v) => v)
      ).values(),
    ] as string[];
    this.logger.log(
      `Inserted ${
        insertedIndicateurValeurs.length
      } computed indicateur valeurs for collectivite ${collectiviteId} and identifiants ${insertedIndicateurValeurIdentifiants.join(
        ','
      )}`
    );
    return {
      valeursCount: insertedIndicateurValeurs.length,
      identifiants: insertedIndicateurValeurIdentifiants,
      collectiviteId,
    };
  }
  dedoublonnageIndicateurValeursParSource =
    deduplicateIndicateurValeursBySource;
  groupeIndicateursValeursParIndicateur = groupIndicateurValeurs;
  groupeIndicateursValeursParIndicateurEtSource =
    groupIndicateurValeursBySource;
}
