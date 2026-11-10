import { Inject, Injectable, Logger } from '@nestjs/common';
import { CheckElectrificationEligibilityService } from '@tet/backend/plans/plans/electrification/check-electrification-eligibility/check-electrification-eligibility.service';
import { CreatePlanAggregateService } from '@tet/backend/plans/plans/create-plan-aggregate/create-plan-aggregate.service';
import { CreatePlanAggregateOutput } from '@tet/backend/plans/plans/create-plan-aggregate/create-plan-aggregate.types';
import { ResolveEntityService } from '@tet/backend/plans/plans/import-plan-aggregate/resolvers/resolve-entity.service';
import { PersistPlanIndicateursService } from '@tet/backend/plans/plans/persist-plan-indicateurs/persist-plan-indicateurs.service';
import { ServiceSecondArg } from '@tet/backend/utils/nest/service-second-arg.utils';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import {
  isFailedResult,
  TransactionManager,
} from '@tet/backend/utils/transaction/transaction-manager.service';
import { ImportReport } from '../../models/import-report';
import type { ElectrificationConfig } from '@tet/domain/plans';
import { ELECTRIFICATION_CONFIG } from '../electrification.constants';
import { PrepareElectrificationImportService } from '../extract-plan/prepare-electrification-import.service';
import { ElectrificationIssue } from '../electrification-issue';
import { ResolvedElectrificationFiches } from '../resolve-fiches/electrification-fiches.schema';
import { ElectrificationPersistenceErrors as Errors } from './electrification-persistence.errors';
import { ElectrificationImportAuthorization } from './electrification-import-authorization';
import { ElectrificationPlanAdapter } from './electrification-plan.adapter';
import { ElectrificationIndicateursAdapter } from './electrification-indicateurs.adapter';

type PersistInput = {
  collectiviteId: number;
  nom: string;
  checkpoint: unknown;
};
type PersistOutput = Pick<
  CreatePlanAggregateOutput,
  'planId' | 'createdFicheIds'
> & { report: ImportReport };

/** Persistance interne seulement ; l'appelant possède le job et les effets après commit. */
@Injectable()
export class PersistElectrificationImportService {
  private readonly logger = new Logger(
    PersistElectrificationImportService.name
  );

  constructor(
    @Inject(ELECTRIFICATION_CONFIG)
    private readonly catalogue: ElectrificationConfig,
    private readonly preparation: PrepareElectrificationImportService,
    private readonly eligibility: CheckElectrificationEligibilityService,
    private readonly entities: ResolveEntityService,
    private readonly aggregate: CreatePlanAggregateService,
    private readonly indicateurs: PersistPlanIndicateursService,
    private readonly transactions: TransactionManager
  ) {}

  async persist(
    { collectiviteId, nom, checkpoint }: PersistInput,
    context: ServiceSecondArg
  ): Promise<Result<PersistOutput, ElectrificationIssue[]>> {
    if (typeof nom !== 'string' || !nom.trim()) {
      return failure([Errors.issue('INVALID_ELECTRIFICATION_PLAN_NAME')]);
    }
    // Le checkpoint documentaire est validé et résolu à nouveau, sans nouvel appel IA.
    const preparation = await this.preparation.prepare(
      { collectiviteId, resumeFrom: checkpoint },
      context
    );
    if (!preparation.success) return preparation;
    const { prepared } = preparation.data;
    const adapted = ElectrificationIndicateursAdapter.toPersistence(
      prepared,
      this.catalogue,
      { collectiviteId, dateVersion: new Date().toISOString() }
    );
    if (!adapted.success) return adapted;
    const { input: indicateursInput, locations } = adapted.data;
    return this.transactions.executeSingle<
      PersistOutput,
      ElectrificationIssue[]
    >(async (tx) => {
      const transactionContext = { user: context.user, tx };
      try {
        const references = await this.indicateurs.lockAndValidate(
          indicateursInput,
          transactionContext
        );
        if (!references.success)
          return failure(
            ElectrificationIndicateursAdapter.toIssues(
              references.error,
              locations
            )
          );
        const authorization =
          await ElectrificationImportAuthorization.forCollectivite(
            this.eligibility,
            { collectiviteId },
            transactionContext
          );
        if (!authorization.success)
          return failure([Errors.issue('ELECTRIFICATION_IMPORT_NOT_ALLOWED')]);
        const entities = await this.entities.resolveFicheEntities(
          collectiviteId,
          ElectrificationPlanAdapter.getEntityInputs(prepared),
          tx,
          context.user
        );
        if (!entities.success)
          return failure([Errors.issue('ELECTRIFICATION_PERSISTENCE_FAILED')]);
        const created = await this.aggregate.create(
          ElectrificationPlanAdapter.toAggregate(
            {
              collectiviteId,
              nom: nom.trim(),
              typeId: authorization.data.typeId,
            },
            prepared,
            entities.data
          ),
          {
            ...transactionContext,
            planCreateAuthorization: authorization.data,
          }
        );
        if (!created.success)
          return failure([Errors.issue('ELECTRIFICATION_PERSISTENCE_FAILED')]);
        const indicateurs = await this.indicateurs.persist(
          indicateursInput,
          created.data,
          transactionContext
        );
        if (!indicateurs.success)
          return failure(
            ElectrificationIndicateursAdapter.toIssues(
              indicateurs.error,
              locations
            )
          );
        return success({
          planId: created.data.planId,
          createdFicheIds: created.data.createdFicheIds,
          report: {
            ...prepared.report,
            issues: [
              ...prepared.report.issues,
              ...ElectrificationIndicateursAdapter.toConflictIssues(
                indicateurs.data,
                locations
              ),
              ...this.booleanObservations(prepared),
            ],
          },
        });
      } catch (error) {
        if (
          isFailedResult<ElectrificationIssue[]>(error) &&
          Array.isArray(error.error)
        )
          return error;
        this.logger.error('Impossible de créer le plan Électrification', error);
        return failure([Errors.issue('ELECTRIFICATION_PERSISTENCE_FAILED')]);
      }
    }, context.tx);
  }

  private booleanObservations(
    prepared: ResolvedElectrificationFiches
  ): ElectrificationIssue[] {
    return prepared.fiches.flatMap((fiche) =>
      fiche.mode === 'link'
        ? []
        : fiche.indicateurs.flatMap((indicateur) => {
            if (indicateur.mode !== 'sous-action') return [];
            const { resultat, anneeResultat, objectif, anneeObjectif } =
              indicateur.observation;
            const observations = [
              resultat === null
                ? null
                : `Résultat : ${resultat ? 'Oui' : 'Non'} (${anneeResultat}).`,
              objectif === null
                ? null
                : `Objectif : ${objectif ? 'Oui' : 'Non'} (${anneeObjectif}).`,
            ].filter(Boolean);
            return observations.length
              ? [
                  {
                    kind: 'preserved-data' as const,
                    code: 'BOOLEAN_INDICATEUR_OBSERVATION',
                    message: observations.join(' '),
                    location: indicateur.source.location,
                  },
                ]
              : [];
          })
    );
  }
}
