import { Injectable, Logger } from '@nestjs/common';
import DatabaseService from '../../common/services/database.service';
import {
  CreateFicheActionType,
  ficheActionTable,
} from '../models/fiche-action.table';
import TagService from '../../taxonomie/services/tag.service';
import { actionImpactFicheActionTable } from '../models/action-impact-fiche-action.table';
import { ficheActionActionTable } from '../models/fiche-action-action.table';
import { ficheActionPartenaireTagTable } from '../models/fiche-action-partenaire-tag.table';
import { ficheActionEffetAttenduTable } from '../models/fiche-action-effet-attendu.table';
import { ficheActionIndicateurTable } from '../models/fiche-action-indicateur.table';
import { ficheActionSousThematiqueTable } from '../models/fiche-action-sous-thematique.table';
import { ficheActionThematiqueTable } from '../models/fiche-action-thematique.table';

@Injectable()
export default class FicheService {
  private readonly logger = new Logger(FicheService.name);

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly tagService: TagService,
  ) {}

  /**
   * Crée une fiche action
   * @param fiche
   * @return identifiant de la fiche crée
   */
  async createFiche(fiche: CreateFicheActionType): Promise<number> {
    this.logger.log(
      `Création de la fiche ${fiche.titre} pour la collectivité ${fiche.collectiviteId}`,
    );
    const ficheCree = await this.databaseService.db
      .insert(ficheActionTable)
      .values(fiche)
      .returning();
    return ficheCree[0]?.id;
  }

  /**
   * Ajoute une thématique à une fiche
   * @param ficheId identifiant de la fiche
   * @param thematiqueId identifiant de la thématique
   */
  async addThematique(ficheId: number, thematiqueId: number): Promise<void> {
    await this.databaseService.db.insert(ficheActionThematiqueTable).values({
      ficheId: ficheId,
      thematiqueId: thematiqueId,
    });
  }

  /**
   * Ajoute une sous-thématique à une fiche
   * @param ficheId identifiant de la fiche
   * @param thematiqueId identifiant de la sous-thématique
   */
  async addSousThematique(
    ficheId: number,
    thematiqueId: number,
  ): Promise<void> {
    await this.databaseService.db
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
   */
  async addIndicateur(ficheId: number, indicateurId: number): Promise<void> {
    await this.databaseService.db.insert(ficheActionIndicateurTable).values({
      ficheId: ficheId,
      indicateurId: indicateurId,
    });
  }

  /**
   * Ajoute un effet attendu à une fiche
   * @param ficheId identifiant de la fiche
   * @param effetAttenduId identifiant de l'effet
   */
  async addEffetAttendu(
    ficheId: number,
    effetAttenduId: number,
  ): Promise<void> {
    await this.databaseService.db.insert(ficheActionEffetAttenduTable).values({
      ficheId: ficheId,
      effetAttenduId: effetAttenduId,
    });
  }

  /**
   * Ajoute un partenaire à une fiche à partir de l'id du tag
   * @param ficheId identifiant de la fiche
   * @param tagId identifiant du partenaire
   */
  async addPartenaireById(ficheId: number, tagId: number): Promise<void> {
    await this.databaseService.db.insert(ficheActionPartenaireTagTable).values({
      ficheId: ficheId,
      partenaireTagId: tagId,
    });
  }

  /**
   * Ajoute un partenaire à une fiche à partir du nom du partenaire et la collectivité
   * @param ficheId identifiant de la fiche
   * @param nomTag nom du partenaire
   * @param collectiviteId identifiant de la collectivité
   */
  async addPartenaireByNom(
    ficheId: number,
    nomTag: string,
    collectiviteId: number,
  ): Promise<void> {
    const tagId = await this.tagService.getPartenaireId(nomTag, collectiviteId);
    await this.addPartenaireById(ficheId, tagId);
  }

  // On ajoute le financement

  /**
   * Ajoute une action du référentiel à une fiche
   * @param ficheId identifiant de la fiche
   * @param actionId identifiant de l'action
   */
  async addActionReferentiel(ficheId: number, actionId: string): Promise<void> {
    await this.databaseService.db.insert(ficheActionActionTable).values({
      ficheId: ficheId,
      actionId: actionId,
    });
  }

  /**
   * Ajoute une action à impact à une fiche
   * @param ficheId identifiant de la fiche
   * @param actionId identifiant de l'action
   */
  async addActionImpact(ficheId: number, actionId: number): Promise<void> {
    await this.databaseService.db.insert(actionImpactFicheActionTable).values({
      ficheId: ficheId,
      actionImpactId: actionId,
    });
  }
}
