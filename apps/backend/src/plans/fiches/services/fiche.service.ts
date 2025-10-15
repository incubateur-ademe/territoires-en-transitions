import {
  FicheAggregateCreation,
  PersonOrTag,
} from '@/backend/plans/fiches/domain/fiche.types';
import { ficheActionBudgetTable } from '@/backend/plans/fiches/fiche-action-budget/fiche-action-budget.table';
import { ficheActionActionImpactTable } from '@/backend/plans/fiches/shared/models/fiche-action-action-impact.table';
import { ficheActionActionTable } from '@/backend/plans/fiches/shared/models/fiche-action-action.table';
import { ficheActionAxeTable } from '@/backend/plans/fiches/shared/models/fiche-action-axe.table';
import { ficheActionEffetAttenduTable } from '@/backend/plans/fiches/shared/models/fiche-action-effet-attendu.table';
import { ficheActionFinanceurTagTable } from '@/backend/plans/fiches/shared/models/fiche-action-financeur-tag.table';
import { ficheActionIndicateurTable } from '@/backend/plans/fiches/shared/models/fiche-action-indicateur.table';
import { ficheActionPartenaireTagTable } from '@/backend/plans/fiches/shared/models/fiche-action-partenaire-tag.table';
import { ficheActionPiloteTable } from '@/backend/plans/fiches/shared/models/fiche-action-pilote.table';
import { ficheActionReferentTable } from '@/backend/plans/fiches/shared/models/fiche-action-referent.table';
import { ficheActionServiceTagTable } from '@/backend/plans/fiches/shared/models/fiche-action-service-tag.table';
import { ficheActionSousThematiqueTable } from '@/backend/plans/fiches/shared/models/fiche-action-sous-thematique.table';
import { ficheActionStructureTagTable } from '@/backend/plans/fiches/shared/models/fiche-action-structure-tag.table';
import { ficheActionThematiqueTable } from '@/backend/plans/fiches/shared/models/fiche-action-thematique.table';
import { ficheActionTable } from '@/backend/plans/fiches/shared/models/fiche-action.table';
import { failure, Result, success } from '@/backend/shared/types/result';
import { DatabaseService } from '@/backend/utils/database/database.service';
import { Transaction } from '@/backend/utils/database/transaction.utils';
import { Injectable } from '@nestjs/common';

@Injectable()
export class FicheService {
  constructor(private readonly databaseService: DatabaseService) {}

  async create(
    input: FicheAggregateCreation,
    tx: Transaction
  ): Promise<Result<number, string>> {
    try {
      const fiche = await (tx ?? this.databaseService.db)
        .insert(ficheActionTable)
        .values({
          collectiviteId: input.collectiviteId,
          titre: input.titre,
          description: input.description,
          objectifs: input.objectifs,
          cibles: input.cibles,
          ressources: input.ressources,
          financements: input.financements,
          statut: input.statut,
          priorite: input.priorite,
          dateDebut: input.dateDebut?.toISOString(),
          dateFin: input.dateFin?.toISOString(),
          ameliorationContinue: input.ameliorationContinue,
          calendrier: input.calendrier,
          notesComplementaires: input.notesComplementaires,
          instanceGouvernance: input.instanceGouvernance,
          participationCitoyenneType: input.participationCitoyenneType,
        })
        .returning();
      const ficheId = fiche[0]?.id;
      if (!ficheId) {
        return failure('Failed to create fiche');
      }

      // Add thematiques
      if (input.thematiques?.length) {
        await Promise.all(
          input.thematiques.map((id) => this.addThematique(ficheId, id, tx))
        );
      }

      // Add sous-thematiques
      if (input.sousThematiques?.length) {
        await Promise.all(
          input.sousThematiques.map((id) =>
            this.addSousThematique(ficheId, id, tx)
          )
        );
      }

      if (input.effetsAttendus?.length) {
        await Promise.all(
          input.effetsAttendus.map((id) =>
            this.addEffetAttendu(ficheId, id, tx)
          )
        );
      }

      if (input.structures?.length) {
        for (const structureId of input.structures) {
          const result = await this.addStructure(ficheId, structureId, tx);
          if (!result.success) {
            return result;
          }
        }
      }

      if (input.services?.length) {
        for (const serviceId of input.services) {
          await this.addService(ficheId, serviceId, tx);
        }
      }

      if (input.pilotes?.length) {
        await Promise.all(
          input.pilotes.map((pilote) => this.addPilote(ficheId, pilote, tx))
        );
      }

      if (input.referents?.length) {
        await Promise.all(
          input.referents.map((referent) =>
            this.addReferent(ficheId, referent, tx)
          )
        );
      }

      if (input.financeurs?.length) {
        await Promise.all(
          input.financeurs.map((financeur) =>
            this.addFinanceur(ficheId, financeur, tx)
          )
        );
      }

      if (input.partenaires?.length) {
        await Promise.all(
          input.partenaires.map((partenaire) =>
            this.addPartenaire(ficheId, partenaire, tx)
          )
        );
      }

      if (input.budgetPrevisionnel) {
        await this.addBudgetPrevisionnel(ficheId, input.budgetPrevisionnel, tx);
      }
      return success(ficheId);
    } catch (error) {
      return failure(
        `Error creating fiche ${input.titre}: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
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
    tx: Transaction
  ): Promise<Result<boolean, string>> {
    try {
      await tx.insert(ficheActionStructureTagTable).values({
        ficheId: ficheId,
        structureTagId: tagId,
      });
      return success(true);
    } catch (error) {
      return failure(error instanceof Error ? error.message : 'undefined');
    }
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
    tx: Transaction
  ): Promise<void> {
    await tx.insert(ficheActionServiceTagTable).values({
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
    { tagId, montant }: { tagId: number; montant: number },
    tx: Transaction
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
    pilote: PersonOrTag,
    tx: Transaction
  ): Promise<void> {
    await tx.insert(ficheActionPiloteTable).values({
      ficheId: ficheId,
      tagId: pilote.tagId,
      userId: pilote.userId,
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
    referent: { userId?: string; tagId?: number },
    tx: Transaction
  ): Promise<void> {
    await tx.insert(ficheActionReferentTable).values({
      ficheId: ficheId,
      tagId: referent.tagId,
      userId: referent.userId,
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
    tx: Transaction
  ): Promise<void> {
    await tx.insert(ficheActionActionTable).values({
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
    tx: Transaction
  ): Promise<void> {
    await tx.insert(ficheActionActionImpactTable).values({
      ficheId: ficheId,
      actionImpactId: actionId,
    });
  }

  async addBudgetPrevisionnel(
    ficheId: number,
    budget: number,
    tx: Transaction
  ): Promise<void> {
    await tx.insert(ficheActionBudgetTable).values({
      ficheId,
      type: 'investissement',
      unite: 'HT',
      budgetPrevisionnel: budget,
    });
  }

  async linkFicheToAxe(
    ficheId: number,
    axeId: number,
    tx: Transaction
  ): Promise<Result<boolean, string>> {
    const result = await tx
      .insert(ficheActionAxeTable)
      .values({
        ficheId: ficheId,
        axeId: axeId,
      })
      .returning();
    return result.length > 0
      ? success(true)
      : failure('Failed to link fiche to axe');
  }
}
