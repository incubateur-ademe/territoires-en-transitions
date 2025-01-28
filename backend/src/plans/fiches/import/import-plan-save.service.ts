import { Injectable } from '@nestjs/common';
import {
  AxeImport,
  FicheImport,
  TagImport,
} from '@/backend/plans/fiches/import/import-plan.dto';
import { TagService } from '@/backend/collectivites/tags/tag.service';
import AxeService from '../axe.service';
import FicheService from '@/backend/plans/fiches/fiche.service';

@Injectable()
export class ImportPlanSaveService {
  constructor(
    private readonly tagService: TagService,
    private readonly axeService: AxeService,
    private readonly ficheService: FicheService
  ) {}

  async tags(collectiviteId: number, tags: Set<TagImport>): Promise<void> {
    for (const tag of tags) {
      if (!tag.id && tag.nom) {
        const tagSaved = await this.tagService.saveTag(
          {
            nom: tag.nom,
            collectiviteId: collectiviteId,
          },
          tag.type
        );
        tag.id = tagSaved.id;
      }
    }
  }

  /**
   * Save a "fiche" and its linked elements
   * @param collectiviteId
   * @param fiches
   */
  async fiches(
    collectiviteId: number,
    fiches: Set<FicheImport>
  ): Promise<void> {
    for (const fiche of fiches) {
      // Save "fiche"
      const ficheId = await this.ficheService.createFiche({
        collectiviteId: collectiviteId,
        titre: fiche.titre,
        description: fiche.description,
        objectifs: fiche.objectifs,
        cibles: fiche?.cibles ? [fiche?.cibles] : [],
        ressources: fiche.resources,
        financements: fiche.financements,
        budgetPrevisionnel: fiche.budget?.toString(),
        statut: fiche.statut,
        priorite: fiche.priorite,
        dateDebut: fiche.dateDebut,
        dateFin: fiche.dateFin,
        ameliorationContinue: fiche.ameliorationContinue,
        calendrier: fiche.calendrier,
        notesComplementaires: fiche.notesComplementaire,
        instanceGouvernance: fiche.gouvernance,
        participationCitoyenneType: fiche.participation,
      });
      fiche.id = ficheId;

      // Save "thématique"
      if (fiche.thematique)
        await this.ficheService.addThematique(ficheId, fiche.thematique);
      // Save "sous thématique"
      if (fiche.sousThematique)
        await this.ficheService.addSousThematique(
          ficheId,
          fiche.sousThematique
        );
      // Save "effet attendu"
      if (fiche.resultats)
        await this.ficheService.addEffetAttendu(ficheId, fiche.resultats);
      // Save "structures"
      for (const tag of fiche.structures) {
        if (tag.id) await this.ficheService.addStructure(ficheId, tag.id);
      }
      // Save "partenaires"
      for (const tag of fiche.partenaires) {
        if (tag.id) await this.ficheService.addPartenaire(ficheId, tag.id);
      }
      // Save "services"
      for (const tag of fiche.services) {
        if (tag.id) await this.ficheService.addService(ficheId, tag.id);
      }
      // Save "pilotes"
      for (const personne of fiche.pilotes) {
        if ((personne.tag && personne.tag.id) || personne.userId)
          await this.ficheService.addPilote(
            ficheId,
            personne.tag?.id,
            personne.userId
          );
      }
      // Save "referents"
      for (const personne of fiche.referents) {
        if ((personne.tag && personne.tag.id) || personne.userId)
          await this.ficheService.addReferent(
            ficheId,
            personne.tag?.id,
            personne.userId
          );
      }
      // Save "financeurs"
      for (const financeur of fiche.financeurs) {
        if (financeur.tag.id)
          await this.ficheService.addFinanceur(
            ficheId,
            financeur.tag.id,
            financeur.montant
          );
      }
    }
  }

  /**
   * Recursive function that saves an "axe" and its sub-"axes"
   * @param collectiviteId
   * @param axe
   */
  async axe(collectiviteId: number, axe: AxeImport): Promise<void> {
    // Save "axe"
    axe.id = await this.axeService.createAxe({
      nom: axe.nom,
      collectiviteId: collectiviteId,
      parent: axe.parent?.id ?? undefined,
      typeId: axe.type ?? undefined,
    });
    // Save link with "fiche".
    // All "fiches" are saved before
    for (const fiche of axe.fiches) {
      if (fiche.id) await this.axeService.addFicheAction(fiche.id, axe.id);
    }
    // Save sub-"axe"
    for (const enfant of axe.enfants) {
      await this.axe(collectiviteId, enfant);
    }
  }
}
