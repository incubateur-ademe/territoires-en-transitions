import { dcpTable } from '@/backend/auth';
import { PermissionOperation } from '@/backend/auth/authorizations/permission-operation.enum';
import { PermissionService } from '@/backend/auth/authorizations/permission.service';
import { ResourceType } from '@/backend/auth/authorizations/resource-type.enum';
import { Injectable, Logger } from '@nestjs/common';
import { aliasedTable, desc, eq } from 'drizzle-orm';
import { AuthenticatedUser } from '../../auth/models/auth.models';
import DatabaseService from '../../common/services/database.service';
import {
  CreateFicheActionType,
  ficheActionTable,
} from '../../plans/fiches/shared/models/fiche-action.table';
import TagService from '../../taxonomie/services/tag.service';
import { actionImpactFicheActionTable } from '../models/action-impact-fiche-action.table';
import { ficheActionActionTable } from '../models/fiche-action-action.table';
import { ficheActionEffetAttenduTable } from '../models/fiche-action-effet-attendu.table';
import { ficheActionIndicateurTable } from '../models/fiche-action-indicateur.table';
import { ficheActionNoteTable } from '../models/fiche-action-note.table';
import { ficheActionPartenaireTagTable } from '../models/fiche-action-partenaire-tag.table';
import { ficheActionSousThematiqueTable } from '../models/fiche-action-sous-thematique.table';
import { ficheActionThematiqueTable } from '../models/fiche-action-thematique.table';

@Injectable()
export default class FicheService {
  private readonly logger = new Logger(FicheService.name);

  constructor(
    private readonly permissionService: PermissionService,
    private readonly databaseService: DatabaseService,
    private readonly tagService: TagService
  ) {}

  /** Renvoi une fiche à partir de son id */
  async getFicheFromId(ficheId: number) {
    const rows = await this.databaseService.db
      .select()
      .from(ficheActionTable)
      .where(eq(ficheActionTable.id, ficheId));
    return rows?.[0] ?? null;
  }

  /** Détermine si un utilisateur peut lire une fiche */
  async canReadFiche(
    ficheId: number,
    tokenInfo: AuthenticatedUser
  ): Promise<boolean> {
    const fiche = await this.getFicheFromId(ficheId);
    if (fiche === null) return false;
    return await this.permissionService.isAllowed(
      tokenInfo,
      fiche.restreint
        ? PermissionOperation.PLANS_FICHES_LECTURE
        : PermissionOperation.PLANS_FICHES_VISITE,
      ResourceType.COLLECTIVITE,
      fiche.collectiviteId
    );
  }

  /** Détermine si un utilisateur peut modifier une fiche */
  async canWriteFiche(
    ficheId: number,
    tokenInfo: AuthenticatedUser
  ): Promise<boolean> {
    const fiche = await this.getFicheFromId(ficheId);
    if (fiche === null) return false;
    return await this.permissionService.isAllowed(
      tokenInfo,
      PermissionOperation.PLANS_FICHES_EDITION,
      ResourceType.COLLECTIVITE,
      fiche.collectiviteId
    );
  }

  /**
   * Crée une fiche action
   * @param fiche
   * @return identifiant de la fiche crée
   */
  async createFiche(fiche: CreateFicheActionType): Promise<number> {
    this.logger.log(
      `Création de la fiche ${fiche.titre} pour la collectivité ${fiche.collectiviteId}`
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
    thematiqueId: number
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
    effetAttenduId: number
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
    collectiviteId: number
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

  /** Lit les notes de suivi attachées à la fiche */
  async getNotes(ficheId: number, tokenInfo: AuthenticatedUser) {
    const canRead = await this.canReadFiche(ficheId, tokenInfo);
    if (!canRead) return false;

    const createdByDCP = aliasedTable(dcpTable, 'createdByDCP');
    const modifiedByDCP = aliasedTable(dcpTable, 'modifiedByDCP');
    const rows = await this.databaseService.db
      .select({
        id: ficheActionNoteTable.id,
        note: ficheActionNoteTable.note,
        dateNote: ficheActionNoteTable.dateNote,
        createdAt: ficheActionNoteTable.createdAt,
        modifiedAt: ficheActionNoteTable.modifiedAt,
        createdByDCP,
        modifiedByDCP,
      })
      .from(ficheActionNoteTable)
      .leftJoin(
        createdByDCP,
        eq(createdByDCP.userId, ficheActionNoteTable.createdBy)
      )
      .leftJoin(
        modifiedByDCP,
        eq(modifiedByDCP.userId, ficheActionNoteTable.modifiedBy)
      )
      .where(eq(ficheActionNoteTable.ficheId, ficheId))
      .orderBy(desc(ficheActionNoteTable.dateNote));

    return rows.map(({ createdByDCP, modifiedByDCP, ...otherCols }) => ({
      ...otherCols,
      createdBy: `${createdByDCP?.prenom} ${createdByDCP?.nom}`,
      modifiedBy: `${modifiedByDCP?.prenom} ${modifiedByDCP?.nom}`,
    }));
  }
}
