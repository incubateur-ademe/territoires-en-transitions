import { Injectable } from '@nestjs/common';
import { TagService } from '@tet/backend/collectivites/tags/tag.service';
import {
  AxeImport,
  FicheImport,
  TagImport,
} from '@tet/backend/plans/fiches/import/import-plan.dto';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import AxeService from '../axe.service';
import { CreateFicheService } from '../create-fiche/create-fiche.service';

@Injectable()
export class ImportPlanSaveService {
  constructor(
    private readonly tagService: TagService,
    private readonly axeService: AxeService,
    private readonly ficheService: CreateFicheService
  ) {}

  /**
   * Save tags
   * @param collectiviteId
   * @param tags
   * @param tx transaction
   */
  async tags(
    collectiviteId: number,
    tags: Set<TagImport>,
    tx: Transaction
  ): Promise<void> {
    for (const tag of tags) {
      if (!tag.id && tag.nom) {
        const tagSaved = await this.tagService.saveTag(
          {
            nom: tag.nom,
            collectiviteId,
          },
          tag.type,
          tx
        );
        tag.id = tagSaved.id;
      }
    }
  }

  /**
   * Save a "fiche" and its linked elements
   * @param collectiviteId
   * @param fiches
   * @param tx transaction
   */
  async fiches(
    collectiviteId: number,
    fiches: Set<FicheImport>,
    tx: Transaction,
    user: AuthenticatedUser
  ): Promise<void> {
    for (const fiche of fiches) {
      const createdFicheResult = await this.ficheService.createFiche(
        {
          collectiviteId,
          titre: fiche.titre,
          description: fiche.description,
          objectifs: fiche.objectifs,
          cibles: fiche?.cibles ? [fiche?.cibles] : [],
          ressources: fiche.resources,
          financements: fiche.financements,
          budgetPrevisionnel: fiche.budget?.toString(), // deprecated
          statut: fiche.statut,
          priorite: fiche.priorite,
          dateDebut: fiche.dateDebut,
          dateFin: fiche.dateFin,
          ameliorationContinue: fiche.ameliorationContinue,
          calendrier: fiche.calendrier,
          notesComplementaires: fiche.notesComplementaire,
          instanceGouvernance: fiche.gouvernance,
          participationCitoyenneType: fiche.participation,
        },
        { tx, user }
      );
      if (!createdFicheResult.success) {
        throw new Error(
          `Échec de la création de la fiche: ${createdFicheResult.error}`
        );
      }
      const ficheId = createdFicheResult.data.id;
      fiche.id = ficheId;

      // Save "thématique"
      if (fiche.thematique)
        await this.ficheService.addThematique(ficheId, fiche.thematique, tx);
      // Save "sous thématique"
      if (fiche.sousThematique)
        await this.ficheService.addSousThematique(
          ficheId,
          fiche.sousThematique,
          tx
        );
      // Save "effet attendu"
      if (fiche.resultats)
        await this.ficheService.addEffetAttendu(ficheId, fiche.resultats, tx);
      // Save "structures"
      for (const tag of fiche.structures) {
        if (tag.id) await this.ficheService.addStructure(ficheId, tag.id, tx);
      }
      // Save "partenaires"
      for (const tag of fiche.partenaires) {
        if (tag.id) await this.ficheService.addPartenaire(ficheId, tag.id, tx);
      }
      // Save "services"
      for (const tag of fiche.services) {
        if (tag.id) await this.ficheService.addService(ficheId, tag.id, tx);
      }
      // Save "pilotes"
      for (const personne of fiche.pilotes) {
        if ((personne.tag && personne.tag.id) || personne.userId)
          await this.ficheService.addPilote(
            ficheId,
            personne.tag?.id,
            personne.userId,
            tx
          );
      }
      // Save "referents"
      for (const personne of fiche.referents) {
        if ((personne.tag && personne.tag.id) || personne.userId)
          await this.ficheService.addReferent(
            ficheId,
            personne.tag?.id,
            personne.userId,
            tx
          );
      }
      // Save "financeurs"
      for (const financeur of fiche.financeurs) {
        if (financeur.tag.id)
          await this.ficheService.addFinanceur(
            ficheId,
            financeur.tag.id,
            financeur.montant,
            tx
          );
      }
      // Save "budget"
      if (fiche.budget) {
        await this.ficheService.addBudgetPrevisionnel(
          ficheId,
          fiche.budget,
          tx
        );
      }
    }
  }

  /**
   * Recursive function that saves an "axe" and its sub-"axes"
   * @param collectiviteId
   * @param axe
   * @param tx transaction
   */
  async axe(
    collectiviteId: number,
    planId: number,
    axe: AxeImport,
    tx: Transaction
  ): Promise<void> {
    const axeAlreadySaved = axe.id;
    if (axeAlreadySaved) {
      return;
    }
    axe.id = await this.axeService.createAxe(
      {
        nom: axe.nom,
        collectiviteId,
        //axe with no parent are depth 1 axe that must be linked to the planId directly
        parent: axe.parent?.id ?? planId,
      },
      tx
    );

    // Save link with "fiche".
    // All "fiches" are saved before
    for (const fiche of axe.fiches) {
      if (fiche.id) await this.axeService.addFicheAction(fiche.id, axe.id, tx);
    }
    // Save sub-"axe"
    for (const enfant of axe.enfants) {
      await this.axe(collectiviteId, planId, enfant, tx);
    }
  }
}
