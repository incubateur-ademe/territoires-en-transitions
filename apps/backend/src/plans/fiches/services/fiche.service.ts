import { ficheActionBudgetTable } from '@/backend/plans/fiches/fiche-action-budget/fiche-action-budget.table';
import {
  failure,
  Result,
  success,
} from '@/backend/plans/fiches/import/types/result';
import { ficheActionActionImpactTable } from '@/backend/plans/fiches/shared/models/fiche-action-action-impact.table';
import { ficheActionActionTable } from '@/backend/plans/fiches/shared/models/fiche-action-action.table';
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
import {
  Cible,
  ficheActionTable,
  ParticipationCitoyenne,
  Priorite,
  Statut,
} from '@/backend/plans/fiches/shared/models/fiche-action.table';
import { DatabaseService } from '@/backend/utils/database/database.service';
import { Transaction } from '@/backend/utils/database/transaction.utils';
import { Injectable } from '@nestjs/common';

export interface Fiche {
  collectiviteId: number;
  titre: string;
  description?: string;
  objectifs?: string;
  cibles?: Cible[];
  ressources?: string;
  financements?: string;
  budgetPrevisionnel?: string;
  statut?: Statut;
  priorite?: Priorite;
  dateDebut?: Date;
  dateFin?: Date;
  ameliorationContinue?: boolean;
  calendrier?: string;
  notesComplementaires?: string;
  instanceGouvernance?: string;
  participationCitoyenneType?: ParticipationCitoyenne;
}

export type FicheAggregate = Fiche & {
  thematiques?: number[];
  sousThematiques?: number[];
  effetsAttendus?: number[];
  structures?: number[];
  services?: number[];
  pilotes?: Array<{
    userId: string;
    tagId?: number;
  }>;
  referents?: Array<{
    userId: string;
    tagId?: number;
  }>;
  financeurs?: Array<{
    tagId: number;
    montant: number;
  }>;
};

@Injectable()
export class FicheService {
  constructor(private readonly databaseService: DatabaseService) {}

  async create(
    input: FicheAggregate,
    tx: Transaction
  ): Promise<Result<number, string>> {
    const fiche = await this.databaseService.db
      .insert(ficheActionTable)
      .values({
        collectiviteId: input.collectiviteId,
        titre: input.titre,
        description: input.description,
        objectifs: input.objectifs,
        cibles: input.cibles,
        ressources: input.ressources,
        financements: input.financements,
        budgetPrevisionnel: input.budgetPrevisionnel,
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
      failure('Failed to create fiche');
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

    // Add effets attendus
    if (input.effetsAttendus?.length) {
      await Promise.all(
        input.effetsAttendus.map((id) => this.addEffetAttendu(ficheId, id, tx))
      );
    }

    // Add structures
    if (input.structures?.length) {
      await Promise.all(
        input.structures.map((id) => this.addStructure(ficheId, id, tx))
      );
    }

    // Add services
    if (input.services?.length) {
      await Promise.all(
        input.services.map((id) => this.addService(ficheId, id, tx))
      );
    }

    // Add pilotes
    if (input.pilotes?.length) {
      await Promise.all(
        input.pilotes.map(({ userId, tagId }) =>
          this.addPilote(ficheId, tagId, userId, tx)
        )
      );
    }

    // Add referents
    if (input.referents?.length) {
      await Promise.all(
        input.referents.map(({ userId, tagId }) =>
          this.addReferent(ficheId, tagId, userId, tx)
        )
      );
    }

    // Add financeurs
    if (input.financeurs?.length) {
      await Promise.all(
        input.financeurs.map(({ tagId, montant }) =>
          this.addFinanceur(ficheId, tagId, montant, tx)
        )
      );
    }

    return success(ficheId);
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
