import { Injectable } from '@nestjs/common';
import PersonnalisationsExpressionService from '@tet/backend/collectivites/personnalisations/services/personnalisations-expression.service';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import {
  isFailedResult,
  TransactionManager,
} from '@tet/backend/utils/transaction/transaction-manager.service';
import { omit } from 'es-toolkit';
import { IndicateurDefinitionLockRepository } from '../definitions/indicateur-definition-lock.repository';
import { IndicateurFormulaReconciliationRepository } from '../definitions/indicateur-formula-reconciliation.repository';
import {
  hasIndicateurFormulaChanged,
  normalizeIndicateurFormula,
} from '../definitions/indicateur-formula.rules';
import { ListPlatformDefinitionsRepository } from '../definitions/list-platform-definitions/list-platform-definitions.repository';
import IndicateurExpressionService from '../valeurs/indicateur-expression.service';
import type { ImportIndicateurDefinitionType } from './import-indicateur-definition.dto';
import type { ImportIndicateurDefinitionError } from './import-indicateur-definition.errors';
import { ImportIndicateurDefinitionRepository } from './import-indicateur-definition.repository';
import type {
  ImportIndicateurContext,
  UpsertIndicateurDefinitionsResult,
} from './import-indicateur-definition.types';
import type { ImportObjectifType } from './import-indicateur-objectif.dto';
import { ImportIndicateurRelationsService } from './import-indicateur-relations.service';
import { mapIndicateurObjectifs } from './map-indicateur-objectifs.rules';
import {
  validateIndicateurDefinitions,
  validateObjectifIdentifiants,
} from './validate-indicateur-definitions.rules';

/** Owns the atomic catalog update, including its durable reconciliation intents. */
@Injectable()
export class UpsertIndicateurDefinitionsService {
  constructor(
    private readonly repository: ImportIndicateurDefinitionRepository,
    private readonly definitionsRepository: ListPlatformDefinitionsRepository,
    private readonly transactionManager: TransactionManager,
    private readonly locks: IndicateurDefinitionLockRepository,
    private readonly relations: ImportIndicateurRelationsService,
    private readonly reconciliations: IndicateurFormulaReconciliationRepository,
    private readonly expressions: IndicateurExpressionService,
    private readonly personnalisations: PersonnalisationsExpressionService
  ) {}

  async upsert(
    {
      definitions: imported,
      objectifs = [],
    }: {
      definitions: ImportIndicateurDefinitionType[];
      objectifs?: ImportObjectifType[];
    },
    context: ImportIndicateurContext
  ): Promise<
    Result<UpsertIndicateurDefinitionsResult, ImportIndicateurDefinitionError>
  > {
    const validation = validateIndicateurDefinitions(imported, {
      indicateurs: this.expressions,
      personnalisations: this.personnalisations,
    });
    if (!validation.success) return validation;
    const objectifsValidation = validateObjectifIdentifiants(
      objectifs,
      imported
    );
    if (!objectifsValidation.success) return objectifsValidation;

    try {
      const identifiantsReferentiel = imported.map(
        (definition) => definition.identifiantReferentiel
      );
      const existing = await this.definitionsRepository.listPlatformDefinitions(
        { identifiantsReferentiel },
        context.tx
      );
      const expected = new Map(
        existing.map((definition) => [
          definition.identifiantReferentiel,
          definition,
        ])
      );
      const importedByIdentifiant = new Map(
        imported.map((definition) => [
          definition.identifiantReferentiel,
          definition,
        ])
      );
      const periodiciteChanges = existing.filter((definition) => {
        const requested = importedByIdentifiant.get(
          definition.identifiantReferentiel ?? ''
        );
        return requested && requested.periodicite !== definition.periodicite;
      });
      if (periodiciteChanges.length) {
        return failure(
          'INVALID_IMPORT',
          new Error(
            `La périodicité de l'indicateur ${periodiciteChanges[0].identifiantReferentiel} est fixée à sa création`
          )
        );
      }

      const result = await this.transactionManager.executeSingle<
        UpsertIndicateurDefinitionsResult,
        ImportIndicateurDefinitionError | Error
      >(async (tx) => {
        try {
          await this.locks.lockForDefinitionMutation(tx);
          const currentDefinitions =
            await this.repository.listDefinitionSnapshots(
              identifiantsReferentiel,
              tx
            );
          const current = new Map(
            currentDefinitions.map((definition) => [
              definition.identifiantReferentiel,
              definition,
            ])
          );
          for (const identifiant of identifiantsReferentiel) {
            const before = expected.get(identifiant);
            const now = current.get(identifiant);
            if (
              expected.has(identifiant) !== current.has(identifiant) ||
              before?.periodicite !== now?.periodicite ||
              hasIndicateurFormulaChanged(
                before?.valeurCalcule,
                now?.valeurCalcule
              )
            ) {
              return failure(
                'IMPORT_CONFLICT',
                new Error(
                  `La définition de l'indicateur ${identifiant} a changé pendant l'import du catalogue; relancez l'import`
                )
              );
            }
          }
          // Replace imported relationships within the catalogue transaction.
          await this.repository.deleteGroupRelationsByChildIds(
            existing.map(({ id }) => id),
            tx
          );
          const created = await this.repository.upsertDefinitions(
            imported.map((definition) =>
              omit(definition, ['categories', 'thematiques', 'parents'])
            ),
            tx
          );
          const relations = await this.relations.replace(
            { definitions: imported, created },
            { ...context, tx }
          );
          if (!relations.success) return relations;

          const definitions =
            await this.definitionsRepository.listPlatformDefinitions({}, tx);
          const changedIds = new Set(
            created
              .filter((definition) =>
                hasIndicateurFormulaChanged(
                  expected.get(definition.identifiantReferentiel)
                    ?.valeurCalcule,
                  definition.valeurCalcule
                )
              )
              .map(({ id }) => id)
          );
          const updatedFormulaDefinitions = definitions.filter(({ id }) =>
            changedIds.has(id)
          );
          let reconciliationWorkItemsCount = 0;
          for (const definition of updatedFormulaDefinitions) {
            const sourceIdentifiants = definition.valeurCalcule
              ? this.expressions
                  .extractNeededSourceIndicateursFromFormula(
                    definition.valeurCalcule
                  )
                  .map(({ identifiant }) => identifiant)
              : [];
            const enqueued = await this.reconciliations.enqueueForDefinition(
              {
                indicateurId: definition.id,
                expectedFormula: normalizeIndicateurFormula(
                  definition.valeurCalcule
                ),
                sourceIdentifiants,
              },
              tx
            );
            reconciliationWorkItemsCount += enqueued.workItemsCount;
          }
          const mapped = mapIndicateurObjectifs(objectifs, definitions);
          if (!mapped.success) return mapped;
          if (mapped.data.length) {
            try {
              await this.repository.upsertObjectifs(mapped.data, tx);
            } catch (error) {
              return failure(
                'DATABASE_ERROR',
                new Error(
                  `Error upserting indicateur objectifs: ${
                    error instanceof Error ? error.message : String(error)
                  }`
                )
              );
            }
          }
          return success({
            definitions,
            updatedFormulaDefinitions,
            importedIndicateurIds: created.map(({ id }) => id),
            reconciliationWorkItemsCount,
          });
        } catch (error) {
          return failure(
            'DATABASE_ERROR',
            error instanceof Error ? error : new Error(String(error))
          );
        }
      }, context.tx);
      if (result.success) return result;
      return result.error instanceof Error
        ? failure('DATABASE_ERROR', result.error)
        : failure(result.error, result.cause);
    } catch (error) {
      if (isFailedResult<ImportIndicateurDefinitionError>(error)) return error;
      return failure(
        'DATABASE_ERROR',
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }
}
