import { Injectable, Logger } from '@nestjs/common';
import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import { TransactionManager } from '@tet/backend/utils/transaction/transaction-manager.service';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { ServiceSecondArg } from '@tet/backend/utils/nest/service-second-arg.utils';
import { failure, Result } from '@tet/backend/utils/result.type';
import {
  applyTransition as applyWorkflowTransition,
  computeAvisDeadline,
  DemarchePcaetTransitionEnum,
  DemarcheTypeEnum,
  isDemarchePcaetDiagnosticComplet,
  type DemarchePcaet,
} from '@tet/domain/demarches';
import { PermissionOperationEnum, ResourceType } from '@tet/domain/users';
import { GetDemarchePcaetRepository } from '../get-demarche-pcaet/get-demarche-pcaet.repository';
import { DemarcheDocumentsRepository } from '@tet/backend/demarches/shared/demarche-documents.repository';
import { DemarchePcaetDiagnosticRepository } from '../shared/demarche-pcaet-diagnostic.repository';
import { DemarchePcaetDiagnosticService } from '../shared/demarche-pcaet-diagnostic.service';
import { DemarchePcaetGuardsService } from '../shared/demarche-pcaet-guards.service';
import { DemarchePcaetPilotesRepository } from '../shared/demarche-pcaet-pilotes.repository';
import { DemarchePcaetRefRepository } from '../shared/demarche-pcaet-ref.repository';
import {
  ApplyTransitionError,
  ApplyTransitionErrorEnum,
} from './apply-transition.errors';
import { ApplyTransitionInput } from './apply-transition.input';
import { ApplyTransitionRepository } from './apply-transition.repository';

@Injectable()
export class ApplyTransitionService {
  private readonly logger = new Logger(ApplyTransitionService.name);

  constructor(
    private readonly permissionService: PermissionService,
    private readonly transactionManager: TransactionManager,
    private readonly demarchePcaetRefRepository: DemarchePcaetRefRepository,
    private readonly pilotesRepository: DemarchePcaetPilotesRepository,
    private readonly guardsService: DemarchePcaetGuardsService,
    private readonly diagnosticService: DemarchePcaetDiagnosticService,
    private readonly diagnosticRepository: DemarchePcaetDiagnosticRepository,
    private readonly documentsRepository: DemarcheDocumentsRepository,
    private readonly applyTransitionRepository: ApplyTransitionRepository,
    private readonly getDemarchePcaetRepository: GetDemarchePcaetRepository
  ) {}

  /**
   * Chemin d'écriture unique du statut : permission générale d'édition,
   * puis transition vérifiée (structure + guards serveur) et journalisée.
   */
  async applyTransition(
    input: ApplyTransitionInput,
    { user, tx }: ServiceSecondArg
  ): Promise<Result<DemarchePcaet, ApplyTransitionError>> {
    const executeInTransaction = async (
      transaction: Transaction
    ): Promise<Result<DemarchePcaet, ApplyTransitionError>> => {
      const demarche = await this.demarchePcaetRefRepository.findRef(
        input,
        { forUpdate: true },
        transaction
      );
      if (!demarche) {
        return failure(ApplyTransitionErrorEnum.DEMARCHE_PCAET_NOT_FOUND);
      }

      // Permission d'édition vérifiée sur le collectiviteId stocké (IDOR) ;
      // les conditions plus fines (pilote, délais…) sont des guards.
      const permissionResult = await this.permissionService.isAllowed(
        user,
        PermissionOperationEnum['DEMARCHES.PCAET.MUTATE'],
        ResourceType.COLLECTIVITE,
        { collectiviteId: demarche.collectiviteId },
        transaction
      );
      if (!permissionResult.success) {
        return failure(ApplyTransitionErrorEnum.UNAUTHORIZED);
      }

      const pilotes = await this.pilotesRepository.listPiloteUserIds(
        demarche.id,
        transaction
      );
      // Le diagnostic est lu une seule fois par transition : il sert au guard
      // de complétude, puis à la photo figée si la transition est la
      // transmission.
      const diagnosticPayload = this.guardsService.needsCompletionInputs(
        demarche.status
      )
        ? await this.diagnosticService.loadPayload(
            { demarcheId: demarche.id, collectiviteId: demarche.collectiviteId },
            transaction
          )
        : null;
      const guardResults = this.guardsService.computeGuardResults(
        {
          status: demarche.status,
          pilotes,
          avisDeadlineAt: demarche.avisDeadlineAt,
          planActionId: demarche.planActionId,
        },
        user,
        diagnosticPayload === null
          ? {}
          : {
              documentsComplets:
                await this.documentsRepository.isDocumentsComplet(
                  { ...demarche, type: DemarcheTypeEnum.PCAET },
                  transaction
                ),
              diagnosticComplet:
                isDemarchePcaetDiagnosticComplet(diagnosticPayload),
            }
      );
      const transitionResult = applyWorkflowTransition(
        demarche.status,
        input.transition,
        { guardResults }
      );
      if (!transitionResult.success) {
        return failure(ApplyTransitionErrorEnum[transitionResult.error]);
      }
      const toStatus = transitionResult.data.toStatus;

      // L'échéance des avis est figée au moment de la transmission : si le
      // délai légal change, les dossiers déjà transmis gardent la leur.
      const now = new Date();
      const transmission =
        input.transition === DemarchePcaetTransitionEnum.TRANSMETTRE_POUR_AVIS
          ? {
              transmittedAt: now.toISOString(),
              avisDeadlineAt: computeAvisDeadline(now).toISOString(),
            }
          : undefined;

      const persistResult =
        await this.applyTransitionRepository.persistTransition(
          demarche,
          toStatus,
          input.transition,
          user.id,
          transmission,
          transaction
        );
      if (!persistResult.success) {
        return failure(ApplyTransitionErrorEnum.DATABASE_ERROR);
      }

      // Le diagnostic transmis est figé : les instances consultatives lisent
      // cette photo, que la collectivité continue ou non de faire évoluer ses
      // indicateurs.
      if (transmission) {
        await this.diagnosticRepository.insertSnapshot(
          {
            demarcheId: demarche.id,
            jalon: 'transmission',
            // Toujours non nul ici : on ne transmet que depuis l'élaboration.
            payload:
              diagnosticPayload ??
              (await this.diagnosticService.loadPayload(
                {
                  demarcheId: demarche.id,
                  collectiviteId: demarche.collectiviteId,
                },
                transaction
              )),
            userId: user.id,
          },
          transaction
        );
      }

      this.logger.log(
        `Transition ${input.transition} applied on demarche PCAET ${demarche.id} (${demarche.status} → ${toStatus}) by user ${user.id}`
      );

      const getResult = await this.getDemarchePcaetRepository.getDemarchePcaet(
        { demarcheId: demarche.id, collectiviteId: demarche.collectiviteId },
        transaction
      );
      if (!getResult.success) {
        return failure(ApplyTransitionErrorEnum.DEMARCHE_PCAET_NOT_FOUND);
      }
      if (!this.guardsService.needsCompletionInputs(getResult.data.status)) {
        return {
          success: true,
          data: this.guardsService.enrich(getResult.data, user),
        };
      }
      return {
        success: true,
        data: this.guardsService.enrich(getResult.data, user, {
          documentsComplets: await this.documentsRepository.isDocumentsComplet(
            getResult.data,
            transaction
          ),
          diagnosticComplet: await this.diagnosticService.isDiagnosticComplet(
            {
              demarcheId: getResult.data.id,
              collectiviteId: getResult.data.collectiviteId,
            },
            transaction
          ),
        }),
      };
    };

    return this.transactionManager.executeSingle(executeInTransaction, tx);
  }
}
