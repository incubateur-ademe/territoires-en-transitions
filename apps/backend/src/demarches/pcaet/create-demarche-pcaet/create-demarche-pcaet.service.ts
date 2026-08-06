import { Injectable, Logger } from '@nestjs/common';
import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { ServiceSecondArg } from '@tet/backend/utils/nest/service-second-arg.utils';
import { failure, Result } from '@tet/backend/utils/result.type';
import {
  DEMARCHE_PCAET_DEFAULT_TITRE,
  type DemarchePcaet,
} from '@tet/domain/demarches';
import { PermissionOperationEnum, ResourceType } from '@tet/domain/users';
import { GetDemarchePcaetRepository } from '../get-demarche-pcaet/get-demarche-pcaet.repository';
import { DemarcheDocumentsRepository } from '@tet/backend/demarches/shared/demarche-documents.repository';
import { DemarchePcaetGuardsService } from '../shared/demarche-pcaet-guards.service';
import { DemarchePcaetPilotesRepository } from '../shared/demarche-pcaet-pilotes.repository';
import {
  CreateDemarchePcaetError,
  CreateDemarchePcaetErrorEnum,
} from './create-demarche-pcaet.errors';
import { CreateDemarchePcaetInput } from './create-demarche-pcaet.input';
import { CreateDemarchePcaetRepository } from './create-demarche-pcaet.repository';

@Injectable()
export class CreateDemarchePcaetService {
  private readonly logger = new Logger(CreateDemarchePcaetService.name);

  constructor(
    private readonly permissionService: PermissionService,
    private readonly databaseService: DatabaseService,
    private readonly createDemarchePcaetRepository: CreateDemarchePcaetRepository,
    private readonly pilotesRepository: DemarchePcaetPilotesRepository,
    private readonly getDemarchePcaetRepository: GetDemarchePcaetRepository,
    private readonly guardsService: DemarchePcaetGuardsService,
    private readonly documentsRepository: DemarcheDocumentsRepository
  ) {}

  async createDemarchePcaet(
    input: CreateDemarchePcaetInput,
    { user, tx }: ServiceSecondArg
  ): Promise<Result<DemarchePcaet, CreateDemarchePcaetError>> {
    const permissionResult = await this.permissionService.isAllowed(
      user,
      PermissionOperationEnum['DEMARCHES.PCAET.MUTATE'],
      ResourceType.COLLECTIVITE,
      { collectiviteId: input.collectiviteId },
      tx
    );
    if (!permissionResult.success) {
      return failure(CreateDemarchePcaetErrorEnum.UNAUTHORIZED);
    }

    const executeInTransaction = async (
      transaction: Transaction
    ): Promise<Result<DemarchePcaet, CreateDemarchePcaetError>> => {
      // Une seule démarche « en cours » à la fois : un nouveau dépôt n'est
      // possible qu'une fois la précédente adoptée ou archivée.
      const hasActiveDemarche =
        await this.createDemarchePcaetRepository.hasActiveDemarche(
          input.collectiviteId,
          transaction
        );
      if (hasActiveDemarche) {
        return failure(
          CreateDemarchePcaetErrorEnum.DEMARCHE_EN_COURS_EXISTANTE
        );
      }

      const insertResult =
        await this.createDemarchePcaetRepository.insertDemarche(
          {
            collectiviteId: input.collectiviteId,
            titre: input.titre?.trim() || DEMARCHE_PCAET_DEFAULT_TITRE,
            description: input.description ?? '',
            obligation: input.obligation,
            launchedAt: input.launchedAt ?? null,
          },
          user.id,
          transaction
        );
      if (!insertResult.success) {
        return failure(CreateDemarchePcaetErrorEnum[insertResult.error]);
      }
      const demarcheId = insertResult.data.id;

      if (input.pilotes && input.pilotes.length > 0) {
        const pilotesResult = await this.pilotesRepository.setPilotes(
          demarcheId,
          input.pilotes,
          user.id,
          transaction
        );
        if (!pilotesResult.success) {
          return failure(CreateDemarchePcaetErrorEnum.SET_PILOTES_ERROR);
        }
      }

      this.logger.log(
        `Demarche PCAET ${demarcheId} created for collectivite ${input.collectiviteId} by user ${user.id}`
      );

      const getResult = await this.getDemarchePcaetRepository.getDemarchePcaet(
        { demarcheId, collectiviteId: input.collectiviteId },
        transaction
      );
      if (!getResult.success) {
        return failure(
          CreateDemarchePcaetErrorEnum.CREATE_DEMARCHE_PCAET_ERROR
        );
      }
      return {
        success: true,
        data: this.guardsService.enrich(getResult.data, user, {
          dossierComplet: await this.documentsRepository.isDossierComplet(
            getResult.data,
            transaction
          ),
        }),
      };
    };

    return tx
      ? executeInTransaction(tx)
      : this.databaseService.db.transaction(executeInTransaction);
  }
}
