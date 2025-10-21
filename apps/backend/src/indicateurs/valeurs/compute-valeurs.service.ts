import {
  IndicateurDefinition,
  indicateurDefinitionTable,
} from '@/backend/indicateurs/definitions/indicateur-definition.table';
import { ListDefinitionsService } from '@/backend/indicateurs/definitions/list-definitions/list-definitions.service';
import { ListDefinitionsHavingComputedValueRepository } from '@/backend/indicateurs/definitions/list-platform-predefined-definitions/list-definitions-having-computed-value.repository';
import { indicateurSourceMetadonneeTable } from '@/backend/indicateurs/shared/models/indicateur-source-metadonnee.table';
import { indicateurSourceSourceCalculTable } from '@/backend/indicateurs/shared/models/indicateur-source-source-calcul.table';
import { indicateurSourceTable } from '@/backend/indicateurs/shared/models/indicateur-source.table';
import IndicateurSourcesService from '@/backend/indicateurs/sources/indicateur-sources.service';
import IndicateurExpressionService from '@/backend/indicateurs/valeurs/indicateur-expression.service';
import {
  IndicateurValeur,
  IndicateurValeurInsert,
  indicateurValeurTable,
  IndicateurValeurWithIdentifiant,
} from '@/backend/indicateurs/valeurs/indicateur-valeur.table';
import {
  COLLECTIVITE_SOURCE_ID,
  DEFAULT_ROUNDING_PRECISION,
} from '@/backend/indicateurs/valeurs/valeurs.constants';
import { DatabaseService } from '@/backend/utils/database/database.service';
import { roundTo } from '@/backend/utils/number.utils';
import { Injectable, Logger } from '@nestjs/common';
import {
  and,
  eq,
  getTableColumns,
  inArray,
  isNull,
  or,
  sql,
  SQLWrapper,
} from 'drizzle-orm';
import { isNil } from 'es-toolkit';

@Injectable()
export default class ComputeValeursService {
  private readonly logger = new Logger(ComputeValeursService.name);

  /**
   * By default, we can use the INSEE source to calculate the values for other sources
   */
  static DEFAULT_SOURCE_CALCUL_IDS = ['insee'];

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly indicateurDefinitionService: ListDefinitionsService,
    private readonly listDefinitionsHavingComputedValueRepository: ListDefinitionsHavingComputedValueRepository,
    private readonly indicateurSourceService: IndicateurSourcesService,
    private readonly indicateurExpressionService: IndicateurExpressionService
  ) {}

  async getSourcesCalcul() {
    const sourceSourceCalculIds = await this.databaseService.db
      .select({
        sourceId: indicateurSourceTable.id,
        sourceCalculIds: sql<
          string[]
        >`array_agg(${indicateurSourceSourceCalculTable.sourceCalculId})`.as(
          'source_calcul_ids'
        ),
      })
      .from(indicateurSourceTable)
      .leftJoin(
        indicateurSourceSourceCalculTable,
        eq(indicateurSourceTable.id, indicateurSourceSourceCalculTable.sourceId)
      )
      .groupBy(indicateurSourceTable.id);
    sourceSourceCalculIds.forEach((source) => {
      if (!source.sourceCalculIds) {
        source.sourceCalculIds = [];
      } else {
        source.sourceCalculIds = source.sourceCalculIds.filter(
          (id) => id !== null
        );
      }
      ComputeValeursService.DEFAULT_SOURCE_CALCUL_IDS.forEach(
        (defaultSourceCalculId) => {
          if (
            source.sourceId !== defaultSourceCalculId &&
            !source.sourceCalculIds.includes(defaultSourceCalculId)
          ) {
            source.sourceCalculIds.push(defaultSourceCalculId);
            this.logger.log(
              `Allow to use ${defaultSourceCalculId} to compute ${source.sourceId} indicateur values`
            );
          }
        }
      );
    });
    sourceSourceCalculIds.push({
      sourceId: COLLECTIVITE_SOURCE_ID,
      sourceCalculIds: ComputeValeursService.DEFAULT_SOURCE_CALCUL_IDS,
    });

    return sourceSourceCalculIds;
  }

  async getAllSourceIdentifiants(
    forComputedIndicateurDefinitions?: IndicateurDefinition[]
  ): Promise<string[]> {
    if (!forComputedIndicateurDefinitions) {
      forComputedIndicateurDefinitions =
        await this.listDefinitionsHavingComputedValueRepository.listDefinitionsHavingComputedValue();
    }

    this.logger.log(
      `Recompute all calculated indicateur valeurs for ${
        forComputedIndicateurDefinitions.length
      } computed indicateur definitions: ${forComputedIndicateurDefinitions
        .map((d) => d.identifiantReferentiel)
        .join(',')}`
    );

    const allSourceIdentifiants: string[] = [];
    forComputedIndicateurDefinitions.forEach((computedIndicateurDefinition) => {
      const sourceIdentifiants =
        this.indicateurExpressionService.extractNeededSourceIndicateursFromFormula(
          computedIndicateurDefinition.valeurCalcule!
        );
      sourceIdentifiants.forEach((source) => {
        if (!allSourceIdentifiants.includes(source.identifiant)) {
          allSourceIdentifiants.push(source.identifiant);
        }
      });
    });
    this.logger.log(
      `Found ${
        allSourceIdentifiants.length
      } source indicateur identifiants: ${allSourceIdentifiants.join(',')}`
    );
    return allSourceIdentifiants;
  }

  private getSourceIndicateurKeyForCalculatedIndicateurValeur(
    indicateurValeur: IndicateurValeurWithIdentifiant,
    forceSourceId?: string
  ): string | null {
    return `${indicateurValeur.collectiviteId}_${indicateurValeur.dateValeur}_${
      forceSourceId || indicateurValeur.sourceId || COLLECTIVITE_SOURCE_ID
    }`;
  }

  /**
   * TODO: unit test
   * @param targetIndicateurDefinition
   * @param sourceIndicateurValeurs
   * @param allowedExtraSourcesForCalculatedValues
   * @param relatedSourceIndicateurValeursByDate
   * @param allowToAddEntry
   * @returns
   */
  private fillRelatedSourceIndicateurValeursByDate(
    targetIndicateurDefinition: IndicateurDefinition,
    sourceIndicateurValeurs: IndicateurValeurWithIdentifiant[],
    allowedExtraSourcesForCalculatedValues: {
      sourceId: string;
      sourceCalculIds: string[];
    }[],
    relatedSourceIndicateurValeursByDate: {
      [collectiviteIdDateSourceIdKey: string]: {
        collectiviteId: number;
        valeurs: IndicateurValeurWithIdentifiant[];
        sourceId?: string | null;
        metadonneeId: number | null;
        missingIdentifiants: string[];
        date: string;
      };
    },
    allowToAddEntry: boolean
  ) {
    // Find related source indicateur valeurs grouped by date/sourceId
    if (targetIndicateurDefinition.valeurCalcule) {
      const neededSourceIndicateurs =
        this.indicateurExpressionService.extractNeededSourceIndicateursFromFormula(
          targetIndicateurDefinition.valeurCalcule
        );

      const neededSourceIndicateurValeurs = sourceIndicateurValeurs.filter(
        (v) =>
          v.indicateurIdentifiant &&
          neededSourceIndicateurs.find(
            (ind) => ind.identifiant === v.indicateurIdentifiant
          )
      );

      neededSourceIndicateurValeurs.forEach((v) => {
        const collectiviteIdDateSourceIdKey =
          this.getSourceIndicateurKeyForCalculatedIndicateurValeur(v);
        if (collectiviteIdDateSourceIdKey) {
          if (
            !relatedSourceIndicateurValeursByDate[
              collectiviteIdDateSourceIdKey
            ] &&
            allowToAddEntry
          ) {
            relatedSourceIndicateurValeursByDate[
              collectiviteIdDateSourceIdKey
            ] = {
              collectiviteId: v.collectiviteId,
              valeurs: [],
              sourceId: v.sourceId,
              metadonneeId: v.metadonneeId,
              date: v.dateValeur,
              missingIdentifiants: [],
            };
          }

          if (
            relatedSourceIndicateurValeursByDate[collectiviteIdDateSourceIdKey]
          ) {
            const dateRelatedSourceIndicateurValeurs =
              relatedSourceIndicateurValeursByDate[
                collectiviteIdDateSourceIdKey
              ];
            // If we didn't know the metadonneeId yet, we set it to the current one
            if (
              dateRelatedSourceIndicateurValeurs.metadonneeId &&
              dateRelatedSourceIndicateurValeurs.metadonneeId < 0
            ) {
              dateRelatedSourceIndicateurValeurs.metadonneeId = v.metadonneeId;
            }
            dateRelatedSourceIndicateurValeurs.valeurs.push(v);
          }
        }

        for (const source of allowedExtraSourcesForCalculatedValues) {
          if (
            source.sourceCalculIds.includes(
              v.sourceId || COLLECTIVITE_SOURCE_ID
            )
          ) {
            this.logger.log(
              `Value of indicateur ${v.indicateurIdentifiant} for source ${v.sourceId} can be used to calculate source ${source.sourceId}`
            );

            const collectiviteIdDateSourceIdKey =
              this.getSourceIndicateurKeyForCalculatedIndicateurValeur(
                v,
                source.sourceId
              );
            if (collectiviteIdDateSourceIdKey) {
              if (
                !relatedSourceIndicateurValeursByDate[
                  collectiviteIdDateSourceIdKey
                ] &&
                allowToAddEntry
              ) {
                relatedSourceIndicateurValeursByDate[
                  collectiviteIdDateSourceIdKey
                ] = {
                  collectiviteId: v.collectiviteId,
                  valeurs: [],
                  sourceId: source.sourceId,
                  metadonneeId: -1, // Set the metadonneeId to -1 to indicate that we don't know it yet
                  date: v.dateValeur,
                  missingIdentifiants: [],
                };
              }

              if (
                relatedSourceIndicateurValeursByDate[
                  collectiviteIdDateSourceIdKey
                ]
              ) {
                relatedSourceIndicateurValeursByDate[
                  collectiviteIdDateSourceIdKey
                ].valeurs.push(v);
              }
            }
          }
        }
      });

      this.logger.log(
        `Found related source indicateur valeurs associated to ${
          Object.keys(relatedSourceIndicateurValeursByDate).length
        } collectiviteId/date/sourceId keys to compute ${
          targetIndicateurDefinition.identifiantReferentiel
        } (${targetIndicateurDefinition.id})`
      );

      // For each date get missing indicateur valeurs
      for (const collectiviteIdDateSourceIdKey in relatedSourceIndicateurValeursByDate) {
        const relatedSourceIndicateurInfo =
          relatedSourceIndicateurValeursByDate[collectiviteIdDateSourceIdKey];

        // Check that we have all needed values
        const missingIndicateurIdentifiants = neededSourceIndicateurs
          .filter(
            (neededIndicateur) =>
              !relatedSourceIndicateurInfo.valeurs.find(
                (v) => v.indicateurIdentifiant === neededIndicateur.identifiant
              )
          )
          .map((ind) => ind.identifiant);

        this.logger.log(
          `${
            missingIndicateurIdentifiants.length
          } missing values (identifiants: ${missingIndicateurIdentifiants.join(
            ','
          )}) to compute ${
            targetIndicateurDefinition.identifiantReferentiel
          } (${targetIndicateurDefinition.id}) for collectivite ${
            relatedSourceIndicateurInfo.collectiviteId
          } at date ${relatedSourceIndicateurInfo.date} with sourceId ${
            relatedSourceIndicateurInfo.sourceId
          }`
        );

        relatedSourceIndicateurInfo.missingIdentifiants =
          missingIndicateurIdentifiants;
      }
    }

    return relatedSourceIndicateurValeursByDate;
  }

  private computeCalculatedIndicateurValeur(
    targetIndicateurDefinition: IndicateurDefinition,
    relatedSourceIndicateurValeursByDate: {
      [collectiviteIdDateSourceIdKey: string]: {
        collectiviteId: number;
        valeurs: IndicateurValeurWithIdentifiant[];
        sourceId?: string | null;
        metadonneeId: number | null;
        missingIdentifiants: string[];
        date: string;
      };
    }
  ): IndicateurValeurInsert[] {
    const computedIndicateurValeurs: IndicateurValeurInsert[] = [];

    if (targetIndicateurDefinition.valeurCalcule) {
      this.logger.log(
        `Compute calculated value for ${targetIndicateurDefinition.identifiantReferentiel} (${targetIndicateurDefinition.id})`
      );
      const neededSourceIndicateurs =
        this.indicateurExpressionService.extractNeededSourceIndicateursFromFormula(
          targetIndicateurDefinition.valeurCalcule
        );
      const neededSourceIndicateurIdentifiants = neededSourceIndicateurs.map(
        (ind) => ind.identifiant
      );

      // For each date check that we can compute the value
      for (const collectiviteIdDateSourceIdKey in relatedSourceIndicateurValeursByDate) {
        const relatedSourceIndicateurInfo =
          relatedSourceIndicateurValeursByDate[collectiviteIdDateSourceIdKey];

        // Check that we were able to define the metadonneeId, otherwise we can't save it
        // WARNING: can happen in once case: we have filled insee data for all sources  but we don't have have other source data
        if (
          !relatedSourceIndicateurInfo.metadonneeId ||
          relatedSourceIndicateurInfo.metadonneeId > 0
        ) {
          // Check that we have all needed values
          const missingMandatoryIndicateurIdentifiants = neededSourceIndicateurs
            .filter(
              (neededIndicateur) =>
                !neededIndicateur.optional &&
                !relatedSourceIndicateurInfo.valeurs.find(
                  (v) =>
                    v.indicateurIdentifiant === neededIndicateur.identifiant
                )
            )
            .map((ind) => ind.identifiant);
          const missingOptionalIndicateurIdentifiants = neededSourceIndicateurs
            .filter(
              (neededIndicateur) =>
                neededIndicateur.optional &&
                !relatedSourceIndicateurInfo.valeurs.find(
                  (v) =>
                    v.indicateurIdentifiant === neededIndicateur.identifiant
                )
            )
            .map((ind) => ind.identifiant);
          if (missingMandatoryIndicateurIdentifiants.length) {
            this.logger.warn(
              `Missing mandatory values (identifiants: ${missingMandatoryIndicateurIdentifiants.join(
                ','
              )}) to compute ${
                targetIndicateurDefinition.identifiantReferentiel
              } (${targetIndicateurDefinition.id}) for collectivite ${
                relatedSourceIndicateurInfo.collectiviteId
              } at date ${relatedSourceIndicateurInfo.date} with sourceId ${
                relatedSourceIndicateurInfo.sourceId
              }`
            );
          } else {
            this.logger.log(
              `All mandatory values are present to compute ${targetIndicateurDefinition.identifiantReferentiel} (${targetIndicateurDefinition.id}) for collectivite ${relatedSourceIndicateurInfo.collectiviteId} at date ${relatedSourceIndicateurInfo.date} with sourceId ${relatedSourceIndicateurInfo.sourceId}`
            );
            const resultatSourceValues: {
              [indicateurIdentifiant: string]: number | null;
            } = {};
            const objectifSourceValues: {
              [indicateurIdentifiant: string]: number | null;
            } = {};
            // TODO: use in priority value with the same sourceId
            relatedSourceIndicateurInfo.valeurs.forEach((v) => {
              if (
                v.sourceId === relatedSourceIndicateurInfo.sourceId &&
                v.indicateurIdentifiant &&
                neededSourceIndicateurIdentifiants.includes(
                  v.indicateurIdentifiant
                )
              ) {
                this.logger.log(
                  `Use source ${v.sourceId} for ${v.indicateurIdentifiant} indicateur values`
                );
                resultatSourceValues[v.indicateurIdentifiant!] = v.resultat;
                objectifSourceValues[v.indicateurIdentifiant!] = v.objectif;
              }
            });

            // No value for the source, we don't want to use only value from other sources. Other sources are used only to be combined
            if (
              !Object.keys(resultatSourceValues).length &&
              !Object.keys(objectifSourceValues).length
            ) {
              continue;
            }

            relatedSourceIndicateurInfo.valeurs.forEach((v) => {
              if (
                isNil(resultatSourceValues[v.indicateurIdentifiant!]) &&
                !isNil(v.resultat) &&
                v.indicateurIdentifiant &&
                neededSourceIndicateurIdentifiants.includes(
                  v.indicateurIdentifiant
                )
              ) {
                this.logger.log(
                  `Use source ${v.sourceId} for ${v.indicateurIdentifiant} resultat indicateur values`
                );
                resultatSourceValues[v.indicateurIdentifiant!] = v.resultat;
              }

              if (
                isNil(objectifSourceValues[v.indicateurIdentifiant!]) &&
                !isNil(v.objectif) &&
                v.indicateurIdentifiant &&
                neededSourceIndicateurIdentifiants.includes(
                  v.indicateurIdentifiant
                )
              ) {
                this.logger.log(
                  `Use source ${v.sourceId} for ${v.indicateurIdentifiant} objectif indicateur values`
                );
                objectifSourceValues[v.indicateurIdentifiant!] = v.objectif;
              }
            });

            const atLeastOneResult = Object.values(resultatSourceValues).some(
              (v) => !isNil(v)
            );
            const computedResultat = atLeastOneResult
              ? this.indicateurExpressionService.parseAndEvaluateExpression(
                  targetIndicateurDefinition.valeurCalcule.toLowerCase(),
                  resultatSourceValues
                )
              : null;

            // Check if at least one non null objectif value is present
            // otherwise if only optional values are used in the formuat may result in zero instead of null
            const atLeastOneObjectif = Object.values(objectifSourceValues).some(
              (v) => !isNil(v)
            );
            const computedObjectif = atLeastOneObjectif
              ? this.indicateurExpressionService.parseAndEvaluateExpression(
                  targetIndicateurDefinition.valeurCalcule.toLowerCase(),
                  objectifSourceValues
                )
              : null;

            const indicateurPrecision = !isNil(
              targetIndicateurDefinition.precision
            )
              ? targetIndicateurDefinition.precision
              : DEFAULT_ROUNDING_PRECISION;
            const indicateurValeur: IndicateurValeurInsert = {
              collectiviteId: relatedSourceIndicateurInfo.collectiviteId,
              indicateurId: targetIndicateurDefinition.id,
              dateValeur: relatedSourceIndicateurInfo.date,
              resultat:
                computedResultat !== null
                  ? roundTo(computedResultat, indicateurPrecision)
                  : null,
              objectif:
                computedObjectif !== null
                  ? roundTo(computedObjectif, indicateurPrecision)
                  : null,
              metadonneeId: relatedSourceIndicateurInfo.metadonneeId,
              calculAuto: true,
              calculAutoIdentifiantsManquants:
                missingOptionalIndicateurIdentifiants,
            };
            computedIndicateurValeurs.push(indicateurValeur);
          }
        }
      }
    }

    return computedIndicateurValeurs;
  }

  private async fetchMissingIndicateurValeurs(
    missingIndicateurValeurs: {
      collectiviteId: number;
      identifiants: string[];
      sourceId?: string | null;
      date: string;
    }[],
    allowedExtraSourcesForCalculatedValues: {
      sourceId: string;
      sourceCalculIds: string[];
    }[]
  ): Promise<IndicateurValeurWithIdentifiant[]> {
    if (!missingIndicateurValeurs.length) {
      return [];
    }

    const condition: (SQLWrapper | undefined)[] = [];
    missingIndicateurValeurs.forEach((missing) => {
      let extraSourceCalculIds = allowedExtraSourcesForCalculatedValues.find(
        (source) =>
          source.sourceId === (missing.sourceId || COLLECTIVITE_SOURCE_ID)
      )?.sourceCalculIds;
      if (!extraSourceCalculIds) {
        // Allow to use Insee data for collectivite data
        extraSourceCalculIds = ComputeValeursService.DEFAULT_SOURCE_CALCUL_IDS;
      }
      this.logger.log(
        `Search missing values for source ${
          missing.sourceId || COLLECTIVITE_SOURCE_ID
        } including allowed extra sources: ${extraSourceCalculIds.join(',')}`
      );

      const missingConditions: (SQLWrapper | undefined)[] = [];
      missingConditions.push(
        eq(indicateurValeurTable.collectiviteId, missing.collectiviteId)
      );
      missingConditions.push(
        eq(indicateurValeurTable.dateValeur, missing.date)
      );
      missingConditions.push(
        inArray(
          indicateurDefinitionTable.identifiantReferentiel,
          missing.identifiants
        )
      );
      if (missing.sourceId) {
        missingConditions.push(
          or(
            eq(indicateurSourceMetadonneeTable.sourceId, missing.sourceId),
            inArray(
              indicateurSourceMetadonneeTable.sourceId,
              extraSourceCalculIds
            )
          )
        );
      } else {
        missingConditions.push(
          or(
            isNull(indicateurSourceMetadonneeTable.sourceId),
            inArray(
              indicateurSourceMetadonneeTable.sourceId,
              extraSourceCalculIds
            )
          )
        );
      }
      condition.push(and(...missingConditions));
    });

    const result = await this.databaseService.db
      .select({
        ...getTableColumns(indicateurValeurTable),
        indicateurIdentifiant: indicateurDefinitionTable.identifiantReferentiel,
        sourceId: indicateurSourceMetadonneeTable.sourceId,
      })
      .from(indicateurValeurTable)
      .leftJoin(
        indicateurDefinitionTable,
        eq(indicateurValeurTable.indicateurId, indicateurDefinitionTable.id)
      )
      .leftJoin(
        indicateurSourceMetadonneeTable,
        eq(
          indicateurValeurTable.metadonneeId,
          indicateurSourceMetadonneeTable.id
        )
      )
      .where(or(...condition));
    return result;
  }

  private mapIndicateurIdToIdentifiantReferentiel(
    indicateurDefinitions: IndicateurDefinition[]
  ): Record<number, string> {
    return indicateurDefinitions.reduce((acc, def) => {
      if (!def.identifiantReferentiel) {
        return acc;
      } else {
        return { ...acc, [def.id]: def.identifiantReferentiel };
      }
    }, {});
  }

  async updateCalculatedIndicateurValeurs(
    updatedSourceIndicateurValeurs: IndicateurValeur[],
    sourceIndicateurDefinitions: IndicateurDefinition[] = []
  ): Promise<IndicateurValeurInsert[]> {
    const indicateurIds = [
      ...new Set(updatedSourceIndicateurValeurs.map((v) => v.indicateurId)),
    ];

    if (!sourceIndicateurDefinitions.length) {
      sourceIndicateurDefinitions =
        await this.indicateurDefinitionService.listIndicateurDefinitions(
          indicateurIds
        );
    } else {
      const missingIds = indicateurIds.filter(
        (id) => !sourceIndicateurDefinitions.find((d) => d.id === id)
      );
      if (missingIds.length) {
        const missingIndicateurDefinitions =
          await this.indicateurDefinitionService.listIndicateurDefinitions(
            missingIds
          );
        sourceIndicateurDefinitions.push(...missingIndicateurDefinitions);
      }
    }
    const indicateurIdToIdentifiant =
      this.mapIndicateurIdToIdentifiantReferentiel(sourceIndicateurDefinitions);

    const sourceMetadonnees =
      await this.indicateurSourceService.getAllIndicateurSourceMetadonnees();

    const allowedExtraSourcesForCalculatedValeurs =
      await this.getSourcesCalcul();

    const updatedSourceIndicateurValeursAvecIdentifiant =
      updatedSourceIndicateurValeurs as IndicateurValeurWithIdentifiant[];
    updatedSourceIndicateurValeursAvecIdentifiant.forEach((v) => {
      v.indicateurIdentifiant = indicateurIdToIdentifiant[v.indicateurId];
      const sourceMetadonnee = v.metadonneeId
        ? sourceMetadonnees.find((sm) => sm.id === v.metadonneeId)
        : undefined;
      if (sourceMetadonnee) {
        v.sourceId = sourceMetadonnee.sourceId;
      }
    });

    const computedIndicateurDefinitions =
      await this.listDefinitionsHavingComputedValueRepository.listDefinitionsHavingComputedValue(
        { identifiantReferentiels: Object.values(indicateurIdToIdentifiant) }
      );

    if (computedIndicateurDefinitions.length) {
      // Fill the map (used at the end)
      computedIndicateurDefinitions.forEach((def) => {
        if (def.identifiantReferentiel) {
          indicateurIdToIdentifiant[def.id] = def.identifiantReferentiel;
        }
      });

      // Retrieve missing indicateur valeur needed to compute calculated indicateur valeurs
      const allMissingIndicateurValeurs: {
        collectiviteId: number;
        identifiants: string[];
        sourceId?: string | null;
        date: string;
      }[] = [];
      const indicateurRelatedSourceIndicateurValeursByDate: {
        [indicateurDefinitionId: string]: {
          [collectiviteIdDateSourceIdKey: string]: {
            collectiviteId: number;
            valeurs: IndicateurValeurWithIdentifiant[];
            sourceId?: string | null;
            metadonneeId: number | null;
            missingIdentifiants: string[];
            date: string;
          };
        };
      } = {};
      computedIndicateurDefinitions.forEach((computedIndicateurDefinition) => {
        const relatedSourceIndicateurValeursByDate =
          this.fillRelatedSourceIndicateurValeursByDate(
            computedIndicateurDefinition,
            updatedSourceIndicateurValeursAvecIdentifiant,
            allowedExtraSourcesForCalculatedValeurs,
            {},
            true
          );
        indicateurRelatedSourceIndicateurValeursByDate[
          `${computedIndicateurDefinition.id}`
        ] = relatedSourceIndicateurValeursByDate;

        for (const collectiviteIdDateSourceIdKey in relatedSourceIndicateurValeursByDate) {
          const relatedSourceIndicateurInfo =
            relatedSourceIndicateurValeursByDate[collectiviteIdDateSourceIdKey];
          if (relatedSourceIndicateurInfo.missingIdentifiants.length) {
            allMissingIndicateurValeurs.push({
              collectiviteId: relatedSourceIndicateurInfo.collectiviteId,
              identifiants: relatedSourceIndicateurInfo.missingIdentifiants,
              sourceId: relatedSourceIndicateurInfo.sourceId,
              date: relatedSourceIndicateurInfo.date,
            });
          }
        }
      });
      this.logger.log(
        `Need to retrieve missing indicateur valeurs (${allMissingIndicateurValeurs.length} sets) to compute calculated indicateur valeurs`
      );
      const retrievedMissingIndicateurValeurs =
        allMissingIndicateurValeurs.length
          ? await this.fetchMissingIndicateurValeurs(
              allMissingIndicateurValeurs,
              allowedExtraSourcesForCalculatedValeurs
            )
          : [];
      this.logger.log(
        `Retrieved ${retrievedMissingIndicateurValeurs.length} missing indicateur valeurs`
      );

      // Now that we have retrieved all needed values, we can compute the calculated indicateur valeurs
      const computedIndicateurValeurs: IndicateurValeurInsert[] = [];
      computedIndicateurDefinitions.forEach((computedIndicateurDefinition) => {
        // Fill missing retrieved values. We don't want to add new entry in the map but only fill existing ones
        const relatedSourceIndicateurValeursByDate =
          indicateurRelatedSourceIndicateurValeursByDate[
            `${computedIndicateurDefinition.id}`
          ];
        this.fillRelatedSourceIndicateurValeursByDate(
          computedIndicateurDefinition,
          retrievedMissingIndicateurValeurs,
          allowedExtraSourcesForCalculatedValeurs,
          relatedSourceIndicateurValeursByDate,
          false
        );

        computedIndicateurValeurs.push(
          ...this.computeCalculatedIndicateurValeur(
            computedIndicateurDefinition,
            relatedSourceIndicateurValeursByDate
          )
        );
      });
      return computedIndicateurValeurs;
    }

    return [];
  }

  async recomputeCollectiviteCalculatedIndicateurValeurs(
    collectiviteId: number,
    computedIndicateurDefinitions: IndicateurDefinition[],
    sourceIdentifiants: string[],
    allowedExtraSourcesForCalculatedValues: {
      sourceId: string;
      sourceCalculIds: string[];
    }[]
  ) {
    this.logger.log(
      `Recompute calculated indicateur valeurs for collectivite ${collectiviteId}`
    );

    const sourceValeurs: IndicateurValeurWithIdentifiant[] =
      await this.databaseService.db
        .select({
          ...getTableColumns(indicateurValeurTable),
          indicateurIdentifiant:
            indicateurDefinitionTable.identifiantReferentiel,
          sourceId: indicateurSourceMetadonneeTable.sourceId,
        })
        .from(indicateurValeurTable)
        .leftJoin(
          indicateurDefinitionTable,
          eq(indicateurValeurTable.indicateurId, indicateurDefinitionTable.id)
        )
        .leftJoin(
          indicateurSourceMetadonneeTable,
          eq(
            indicateurValeurTable.metadonneeId,
            indicateurSourceMetadonneeTable.id
          )
        )
        .where(
          and(
            eq(indicateurValeurTable.collectiviteId, collectiviteId),
            inArray(
              indicateurDefinitionTable.identifiantReferentiel,
              sourceIdentifiants
            )
          )
        );
    this.logger.log(
      `Found ${sourceValeurs.length} source indicateur valeurs for collectivite ${collectiviteId}`
    );

    // We don't want top call updateCalculatedIndicateurValeurs because it's looking for missing values: we already have all collectivite values

    const computedIndicateurValeurs: IndicateurValeurInsert[] = [];
    computedIndicateurDefinitions.forEach((computedIndicateurDefinition) => {
      // Fill the map by date
      const relatedSourceIndicateurValeursByDate =
        this.fillRelatedSourceIndicateurValeursByDate(
          computedIndicateurDefinition,
          sourceValeurs,
          allowedExtraSourcesForCalculatedValues,
          {},
          true
        );
      computedIndicateurValeurs.push(
        ...this.computeCalculatedIndicateurValeur(
          computedIndicateurDefinition,
          relatedSourceIndicateurValeursByDate
        )
      );
    });

    return computedIndicateurValeurs;
  }
}
