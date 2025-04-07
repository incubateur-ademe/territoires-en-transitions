import { ficheActionFinanceurTagTable } from '@/backend/plans/fiches/shared/models/fiche-action-financeur-tag.table';
import { ficheActionPiloteTable } from '@/backend/plans/fiches/shared/models/fiche-action-pilote.table';
import { ficheActionReferentTable } from '@/backend/plans/fiches/shared/models/fiche-action-referent.table';
import { ficheActionServiceTagTable } from '@/backend/plans/fiches/shared/models/fiche-action-service-tag.table';
import { ficheActionStructureTagTable } from '@/backend/plans/fiches/shared/models/fiche-action-structure-tag.table';
import { Transaction } from '@/backend/utils/database/transaction.utils';
import { Injectable, Logger } from '@nestjs/common';
import { ficheActionBudgetTable } from '@/backend/plans/fiches/fiche-action-budget/fiche-action-budget.table';
import { DatabaseService } from '@/backend/utils';
import {
  ficheActionTable,
  FicheCreate,
} from '@/backend/plans/fiches/shared/models/fiche-action.table';
import { ficheActionThematiqueTable } from '@/backend/plans/fiches/shared/models/fiche-action-thematique.table';
import { ficheActionSousThematiqueTable } from '@/backend/plans/fiches/shared/models/fiche-action-sous-thematique.table';
import { ficheActionIndicateurTable } from '@/backend/plans/fiches/shared/models/fiche-action-indicateur.table';
import { ficheActionEffetAttenduTable } from '@/backend/plans/fiches/shared/models/fiche-action-effet-attendu.table';
import { ficheActionPartenaireTagTable } from '@/backend/plans/fiches/shared/models/fiche-action-partenaire-tag.table';
import { ficheActionActionTable } from '@/backend/plans/fiches/shared/models/fiche-action-action.table';
import { ficheActionActionImpactTable } from '@/backend/plans/fiches/shared/models/fiche-action-action-impact.table';

@Injectable()
export default class FicheActionCreateService {
  private readonly logger = new Logger(FicheActionCreateService.name);

  constructor(private readonly databaseService: DatabaseService) {}

  /**
   * Crée une fiche action
   * @param fiche
   * @param tx transaction
   * @return identifiant de la fiche crée
   */
  async createFiche(fiche: FicheCreate, tx?: Transaction): Promise<number> {
    this.logger.log(
      `Création de la fiche ${fiche.titre} pour la collectivité ${fiche.collectiviteId}`
    );
    const ficheCree = await (tx ?? this.databaseService.db)
      .insert(ficheActionTable)
      .values(fiche)
      .returning();
    return ficheCree[0]?.id;
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
   * Ajoute un indicateur à une fiche
   * @param ficheId identifiant de la fiche
   * @param indicateurId identifiant de l'indicateur
   * @param tx transaction
   */
  async addIndicateur(
    ficheId: number,
    indicateurId: number,
    tx?: Transaction
  ): Promise<void> {
    await (tx ?? this.databaseService.db)
      .insert(ficheActionIndicateurTable)
      .values({
        ficheId: ficheId,
        indicateurId: indicateurId,
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
      });
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
    budget: string,
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
