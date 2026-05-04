import { ForbiddenException, Injectable, Logger } from '@nestjs/common';
import { FicheIndexerService } from '@tet/backend/plans/fiches/fiche-indexer/fiche-indexer.service';
import FicheActionPermissionsService from '@tet/backend/plans/fiches/fiche-action-permissions.service';
import { ficheActionTable } from '@tet/backend/plans/fiches/shared/models/fiche-action.table';
import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { Fiche, FicheCreate, ficheSchemaCreate } from '@tet/domain/plans';
import { PermissionOperationEnum, ResourceType } from '@tet/domain/users';
import { UpdateFicheInput } from '../update-fiche/update-fiche.input';
import UpdateFicheService from '../update-fiche/update-fiche.service';
import { CreateFicheResult } from './create-fiche.result';

@Injectable()
export class CreateFicheService {
  private readonly logger = new Logger(CreateFicheService.name);

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly permissionService: PermissionService,
    private readonly ficheActionPermissionsService: FicheActionPermissionsService,
    private readonly updateFicheService: UpdateFicheService,
    private readonly ficheIndexerService: FicheIndexerService
  ) {}

  async createFiche(
    fiche: FicheCreate,
    {
      ficheFields,
      tx,
      user,
    }: {
      ficheFields?: Omit<UpdateFicheInput, 'id'>;
      tx?: Transaction;
      user: AuthenticatedUser;
    }
  ): Promise<CreateFicheResult<Fiche>> {
    this.logger.log(
      `Création de la fiche ${fiche.titre} pour la collectivité ${fiche.collectiviteId}`
    );

    if (user) {
      if (fiche.parentId) {
        // Pour une sous-action, il suffit d'avoir le droit de modifier la
        // fiche parente (ce qui inclut les contributeurs pilotes de la fiche
        // parente via la permission `plans.fiches.update_piloted_by_me`).
        // Lève une ForbiddenException si l'utilisateur ne peut pas écrire
        // la fiche parente.
        await this.ficheActionPermissionsService.canWriteFiche(
          fiche.parentId,
          user,
          tx
        );
        // La sous-action doit appartenir à la même collectivité que sa fiche
        // parente, sinon le droit accordé sur la parente permettrait de créer
        // une fiche dans une autre collectivité en contournant
        // `plans.fiches.create`.
        const parentFiche =
          await this.ficheActionPermissionsService.getFicheFromId(
            fiche.parentId,
            tx
          );
        if (
          parentFiche &&
          parentFiche.collectiviteId !== fiche.collectiviteId
        ) {
          throw new ForbiddenException(
            `La sous-action doit appartenir à la même collectivité que la fiche parente ${fiche.parentId}`
          );
        }
      } else {
        await this.permissionService.isAllowed(
          user,
          PermissionOperationEnum['PLANS.FICHES.CREATE'],
          ResourceType.COLLECTIVITE,
          fiche.collectiviteId,
          false,
          tx
        );
      }
    }
    const validation = ficheSchemaCreate.safeParse(fiche);
    if (!validation.success) {
      const message = validation.error.issues
        .map((issue) => issue.message)
        .join(', ');
      return {
        success: false,
        error: message,
      };
    }

    try {
      const [createdFiche] = await (tx || this.databaseService.db)
        .insert(ficheActionTable)
        .values(fiche)
        .returning();

      const ficheId = createdFiche.id;
      if (!ficheId) {
        return {
          success: false,
          error: `Échec de création de la fiche`,
        };
      }

      if (
        ficheFields &&
        Object.values(ficheFields).filter((v) => v !== undefined).length
      ) {
        const result = await this.updateFicheService.updateFiche({
          ficheId,
          ficheFields,
          user,
          tx,
        });
        if (!result.success) {
          return {
            success: false,
            error: `Échec de la mise à jour de la fiche: ${result.error}`,
          };
        }
      }

      // Indexation Meilisearch : on enfile l'upsert APRÈS l'insertion (et,
      // si applicable, après l'`updateFiche` qui a son propre enqueue —
      // déduplication BullMQ par `jobId`). L'enqueue est wrappé dans un
      // try/catch + warn pour qu'une panne BullMQ ne fasse pas échouer la
      // requête utilisateur ; la dérive est rattrapée par le backfill admin
      // (U8). Mêmes garanties que le webhook post-commit dans
      // `update-fiche.service.ts`.
      try {
        await this.ficheIndexerService.enqueueUpsert(ficheId);
      } catch (err) {
        this.logger.warn(
          `Échec de l'enqueue d'indexation pour la fiche ${ficheId} : ${
            err instanceof Error ? err.message : String(err)
          }`
        );
      }

      return { success: true, data: createdFiche };
    } catch (error) {
      this.logger.error(`Error creating fiche:`, error);
      return {
        success: false,
        error: `Échec de création de la fiche: ${error}`,
      };
    }
  }
}
