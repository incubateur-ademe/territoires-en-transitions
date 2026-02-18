import { Injectable, Logger } from '@nestjs/common';
import { ficheActionBudgetTable } from '@tet/backend/plans/fiches/fiche-action-budget/fiche-action-budget.table';
import { ficheActionActionImpactTable } from '@tet/backend/plans/fiches/shared/models/fiche-action-action-impact.table';
import { ficheActionActionTable } from '@tet/backend/plans/fiches/shared/models/fiche-action-action.table';
import { ficheActionEffetAttenduTable } from '@tet/backend/plans/fiches/shared/models/fiche-action-effet-attendu.table';
import { ficheActionFinanceurTagTable } from '@tet/backend/plans/fiches/shared/models/fiche-action-financeur-tag.table';
import { ficheActionPartenaireTagTable } from '@tet/backend/plans/fiches/shared/models/fiche-action-partenaire-tag.table';
import { ficheActionPiloteTable } from '@tet/backend/plans/fiches/shared/models/fiche-action-pilote.table';
import { ficheActionReferentTable } from '@tet/backend/plans/fiches/shared/models/fiche-action-referent.table';
import { ficheActionServiceTagTable } from '@tet/backend/plans/fiches/shared/models/fiche-action-service-tag.table';
import { ficheActionSousThematiqueTable } from '@tet/backend/plans/fiches/shared/models/fiche-action-sous-thematique.table';
import { ficheActionStructureTagTable } from '@tet/backend/plans/fiches/shared/models/fiche-action-structure-tag.table';
import { ficheActionThematiqueTable } from '@tet/backend/plans/fiches/shared/models/fiche-action-thematique.table';
import { ficheActionTable } from '@tet/backend/plans/fiches/shared/models/fiche-action.table';
import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { Fiche, FicheCreate } from '@tet/domain/plans';
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
    private readonly updateFicheService: UpdateFicheService
  ) {}

  /**
   * Crée une fiche action
   * @return identifiant de la fiche crée
   */
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
      await this.permissionService.isAllowed(
        user,
        PermissionOperationEnum['PLANS.FICHES.CREATE'],
        ResourceType.COLLECTIVITE,
        fiche.collectiviteId,
        false,
        tx
      );
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

      return { success: true, data: createdFiche };
    } catch (error) {
      this.logger.error(`Error creating fiche:`, error);
      return {
        success: false,
        error: `Échec de création de la fiche: ${error}`,
      };
    }
  }

  /**
   * Ajoute une thématique à une fiche
   * @param ficheId identifiant de la fiche
   * @param thematiqueId identifiant de la thématique
   * @param tx transaction
   */
  async addThematique(
    ficheId: number,
    thematiqueId: number,
    tx?: Transaction
  ): Promise<void> {
    await (tx ?? this.databaseService.db)
      .insert(ficheActionThematiqueTable)
      .values({
        ficheId: ficheId,
        thematiqueId: thematiqueId,
      });
  }

  /**
   * Ajoute une sous-thématique à une fiche
   * @param ficheId identifiant de la fiche
   * @param thematiqueId identifiant de la sous-thématique
   * @param tx transaction
   */
  async addSousThematique(
    ficheId: number,
    thematiqueId: number,
    tx?: Transaction
  ): Promise<void> {
    await (tx ?? this.databaseService.db)
      .insert(ficheActionSousThematiqueTable)
      .values({
        ficheId: ficheId,
        thematiqueId: thematiqueId,
      });
  }

  /**
   * Ajoute un effet attendu à une fiche
   * @param ficheId identifiant de la fiche
   * @param effetAttenduId identifiant de l'effet
   * @param tx transaction
   */
  async addEffetAttendu(
    ficheId: number,
    effetAttenduId: number,
    tx?: Transaction
  ): Promise<void> {
    await (tx ?? this.databaseService.db)
      .insert(ficheActionEffetAttenduTable)
      .values({
        ficheId: ficheId,
        effetAttenduId: effetAttenduId,
      });
  }

  /**
   * Ajoute un partenaire à une fiche à partir de l'id du tag
   * @param ficheId identifiant de la fiche
   * @param tagId identifiant du partenaire
   * @param tx transaction
   */
  async addPartenaire(
    ficheId: number,
    tagId: number,
    tx?: Transaction
  ): Promise<void> {
    await (tx ?? this.databaseService.db)
      .insert(ficheActionPartenaireTagTable)
      .values({
        ficheId: ficheId,
        partenaireTagId: tagId,
      })
      .onConflictDoNothing();
  }

  /**
   * Ajoute une structure à une fiche à partir de l'id du tag
   * @param ficheId identifiant de la fiche
   * @param tagId identifiant de la structure
   * @param tx transaction
   */
  async addStructure(
    ficheId: number,
    tagId: number,
    tx?: Transaction
  ): Promise<void> {
    await (tx ?? this.databaseService.db)
      .insert(ficheActionStructureTagTable)
      .values({
        ficheId: ficheId,
        structureTagId: tagId,
      });
  }

  /**
   * Ajoute un service à une fiche à partir de l'id du tag
   * @param ficheId identifiant de la fiche
   * @param tagId identifiant du service
   * @param tx transaction
   */
  async addService(
    ficheId: number,
    tagId: number,
    tx?: Transaction
  ): Promise<void> {
    await (tx ?? this.databaseService.db)
      .insert(ficheActionServiceTagTable)
      .values({
        ficheId: ficheId,
        serviceTagId: tagId,
      });
  }

  /**
   * Ajoute un financeur à une fiche à partir de l'id du tag
   * @param ficheId identifiant de la fiche
   * @param tagId identifiant du financeur
   * @param montant montant du financement par ce financeur
   * @param tx transaction
   */
  async addFinanceur(
    ficheId: number,
    tagId: number,
    montant: number,
    tx?: Transaction
  ): Promise<void> {
    await (tx ?? this.databaseService.db)
      .insert(ficheActionFinanceurTagTable)
      .values({
        ficheId: ficheId,
        financeurTagId: tagId,
        montantTtc: montant,
      });
  }

  /**
   * Ajoute un pilote à une fiche à partir de l'id du tag ou de l'identifiant utilisateur
   * @param ficheId identifiant de la fiche
   * @param tagId identifiant du pilote
   * @param userId identifiant de l'utilisateur pilote
   * @param tx transaction
   */
  async addPilote(
    ficheId: number,
    tagId?: number,
    userId?: string,
    tx?: Transaction
  ): Promise<void> {
    if (tagId || userId)
      await (tx ?? this.databaseService.db)
        .insert(ficheActionPiloteTable)
        .values({
          ficheId: ficheId,
          tagId: tagId,
          userId: userId,
        });
  }

  /**
   * Ajoute un référent à une fiche à partir de l'id du tag ou de l'identifiant utilisateur
   * @param ficheId identifiant de la fiche
   * @param tagId identifiant du référent
   * @param userId identifiant de l'utilisateur référent
   * @param tx transaction
   */
  async addReferent(
    ficheId: number,
    tagId?: number,
    userId?: string,
    tx?: Transaction
  ): Promise<void> {
    if (tagId || userId)
      await (tx ?? this.databaseService.db)
        .insert(ficheActionReferentTable)
        .values({
          ficheId: ficheId,
          tagId: tagId,
          userId: userId,
        });
  }

  /**
   * Ajoute une action du référentiel à une fiche
   * @param ficheId identifiant de la fiche
   * @param actionId identifiant de l'action
   * @param tx transaction
   */
  async addActionReferentiel(
    ficheId: number,
    actionId: string,
    tx?: Transaction
  ): Promise<void> {
    await (tx ?? this.databaseService.db)
      .insert(ficheActionActionTable)
      .values({
        ficheId: ficheId,
        actionId: actionId,
      });
  }

  /**
   * Ajoute une action à impact à une fiche
   * @param ficheId identifiant de la fiche
   * @param actionId identifiant de l'action
   * @param tx transaction
   */
  async addActionImpact(
    ficheId: number,
    actionId: number,
    tx?: Transaction
  ): Promise<void> {
    await (tx ?? this.databaseService.db)
      .insert(ficheActionActionImpactTable)
      .values({
        ficheId: ficheId,
        actionImpactId: actionId,
      });
  }

  async addBudgetPrevisionnel(
    ficheId: number,
    budget: number,
    tx?: Transaction
  ): Promise<void> {
    await (tx ?? this.databaseService.db)
      .insert(ficheActionBudgetTable)
      .values({
        ficheId: ficheId,
        type: 'investissement',
        unite: 'HT',
        budgetPrevisionnel: budget,
      });
  }
}
