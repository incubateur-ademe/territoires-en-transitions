import { Injectable } from '@nestjs/common';
import { collectiviteTable } from '@tet/backend/collectivites/shared/models/collectivite.table';
import { demarcheTable } from '@tet/backend/demarches/shared/models/demarche.table';
import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import { utilisateurCollectiviteAccessTable } from '@tet/backend/users/authorizations/utilisateur-collectivite-access.table';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { ServiceSecondArg } from '@tet/backend/utils/nest/service-second-arg.utils';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import {
  fenetreAvisOuverte,
  instructeurCouvreCollectivite,
  isTypeInstructeur,
  peutDeposerAvisInstructeur,
  type FenetreAvisEntree,
  type PerimetreInstructeurEntree,
} from '@tet/domain/demarches';
import { PermissionOperationEnum, ResourceType } from '@tet/domain/users';
import { and, eq } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import {
  DepotPermissionsError,
  DepotPermissionsErrorEnum,
} from './depot-permissions.errors';
import { pcaetDemandeAvisTable } from './models/pcaet-demande-avis.table';
import { perimetreInstructeurColumns } from './perimetre-instructeur.columns';

/**
 * Ce qu'il faut savoir d'une demande d'avis pour juger une action dessus.
 *
 * À ne pas confondre avec `ContexteInstruction` (`@tet/domain/demarches`), qui
 * dit au titre de quel service on consulte une collectivité — celui-ci sert les
 * gardes, celui-là l'affichage.
 */
export type ContexteDemandeAvis = PerimetreInstructeurEntree &
  FenetreAvisEntree & { instructeurCollectiviteId: number };

@Injectable()
export class DepotPermissionsService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly permissionService: PermissionService
  ) {}

  async canListerDemandes(
    instructeurCollectiviteId: number,
    { user, tx }: ServiceSecondArg
  ): Promise<Result<void, DepotPermissionsError>> {
    const rows = await (tx ?? this.databaseService.db)
      .select({ type: collectiviteTable.type })
      .from(collectiviteTable)
      .where(eq(collectiviteTable.id, instructeurCollectiviteId))
      .limit(1);

    const collectivite = rows[0];
    if (!collectivite || !isTypeInstructeur(collectivite.type)) {
      return failure(DepotPermissionsErrorEnum.UNAUTHORIZED);
    }

    if (!(await this.isMembreActif(user.id, instructeurCollectiviteId, tx))) {
      return failure(DepotPermissionsErrorEnum.UNAUTHORIZED);
    }

    return success(undefined);
  }

  async canConsulterDepot(
    demandeAvisId: number,
    { user, tx }: ServiceSecondArg
  ): Promise<Result<void, DepotPermissionsError>> {
    const contexteResult = await this.resolveContexteInstruction(
      demandeAvisId,
      {
        user,
        tx,
      }
    );
    if (!contexteResult.success) {
      return failure(contexteResult.error);
    }

    return success(undefined);
  }

  /**
   * Rend le contexte de l'instruction : l'appelant qui choisit un titre d'avis y
   * lit le type de l'instructeur pour vérifier qu'il en répond bien.
   */
  /**
   * Peut-on lire un avis **validé** rendu par un autre destinataire du même
   * dossier ?
   *
   * Le droit vient d'avoir été saisi sur cette démarche, pas d'avoir été saisi
   * sur cette demande-là : une DDT ou une DR ADEME suit l'instruction sans y
   * prendre part, et le rapport de la DREAL fait partie de ce qu'elle suit. La
   * condition reste celle du dossier — membre actif d'un service saisi, et
   * périmètre couvrant la déposante — appliquée à *l'une* des saisines.
   *
   * Ne dit rien de la validation de l'avis : c'est à l'appelant de refuser un
   * brouillon, qui ne sort pas de l'espace de son auteur.
   */
  async canConsulterAvisDuneAutreSaisine(
    demandeAvisId: number,
    { user, tx }: ServiceSecondArg
  ): Promise<boolean> {
    const saisines = await this.listSaisinesDeLaDemarche(
      demandeAvisId,
      user.id,
      tx
    );
    return saisines.some(instructeurCouvreCollectivite);
  }

  /**
   * Les saisines de la même démarche dont cet utilisateur est membre actif, avec
   * de quoi rejouer la couverture géographique.
   *
   * La sous-requête part de la demande donnée pour retrouver sa démarche : c'est
   * la seule chose que l'appelant connaisse.
   */
  private async listSaisinesDeLaDemarche(
    demandeAvisId: number,
    userId: string,
    tx?: Transaction
  ): Promise<PerimetreInstructeurEntree[]> {
    const db = tx ?? this.databaseService.db;
    const deposante = alias(collectiviteTable, 'deposante');
    const instructrice = alias(collectiviteTable, 'instructrice');
    const demandeCourante = alias(pcaetDemandeAvisTable, 'demande_courante');

    return (
      db
        .select({
          ...perimetreInstructeurColumns(deposante, instructrice),
        })
        .from(pcaetDemandeAvisTable)
        .innerJoin(
          demandeCourante,
          and(
            eq(demandeCourante.id, demandeAvisId),
            eq(demandeCourante.demarcheId, pcaetDemandeAvisTable.demarcheId)
          )
        )
        .innerJoin(
          demarcheTable,
          eq(demarcheTable.id, pcaetDemandeAvisTable.demarcheId)
        )
        .innerJoin(deposante, eq(deposante.id, demarcheTable.collectiviteId))
        .innerJoin(
          instructrice,
          eq(instructrice.id, pcaetDemandeAvisTable.instructeurCollectiviteId)
        )
        // Membre actif du service saisi : c'est l'appartenance au *service* qui
        // vaut, comme pour la consultation du dossier.
        .innerJoin(
          utilisateurCollectiviteAccessTable,
          and(
            eq(
              utilisateurCollectiviteAccessTable.collectiviteId,
              pcaetDemandeAvisTable.instructeurCollectiviteId
            ),
            eq(utilisateurCollectiviteAccessTable.userId, userId),
            eq(utilisateurCollectiviteAccessTable.isActive, true)
          )
        )
    );
  }

  async canDeposerAvis(
    demandeAvisId: number,
    { user, tx }: ServiceSecondArg
  ): Promise<Result<ContexteDemandeAvis, DepotPermissionsError>> {
    const contexteResult = await this.resolveContexteInstruction(
      demandeAvisId,
      {
        user,
        tx,
      }
    );
    if (!contexteResult.success) {
      return failure(contexteResult.error);
    }
    const contexte = contexteResult.data;

    // Tous les destinataires d'une transmission ne sont pas saisis pour avis :
    // le conseil régional et la DDT reçoivent le dossier en lecture. Aucun rôle
    // ne leur ouvre le dépôt, c'est leur type qui le ferme.
    if (!peutDeposerAvisInstructeur(contexte.instructeurType)) {
      return failure(DepotPermissionsErrorEnum.UNAUTHORIZED);
    }

    // Être membre actif ne suffit pas : déposer un avis est une écriture, elle
    // demande le droit correspondant sur la collectivité instructrice — un rôle
    // LECTURE consulte le dossier sans pouvoir l'instruire.
    const permissionResult = await this.permissionService.isAllowed(
      user,
      PermissionOperationEnum['DEMARCHES.PCAET.MUTATE'],
      ResourceType.COLLECTIVITE,
      { collectiviteId: contexte.instructeurCollectiviteId },
      tx
    );
    if (!permissionResult.success) {
      return failure(DepotPermissionsErrorEnum.UNAUTHORIZED);
    }

    if (!fenetreAvisOuverte(contexte, new Date())) {
      return failure(DepotPermissionsErrorEnum.UNAUTHORIZED);
    }

    return success(contexte);
  }

  /**
   * Barrières communes à toute action d'instruction : la demande existe,
   * l'utilisateur est membre actif de la collectivité instructrice, et celle-ci
   * couvre bien le territoire de la collectivité déposante.
   *
   * Rend le contexte plutôt que de le jeter : les appelants en ont besoin, et
   * le re-résoudre coûterait un aller-retour de plus.
   */
  private async resolveContexteInstruction(
    demandeAvisId: number,
    { user, tx }: ServiceSecondArg
  ): Promise<Result<ContexteDemandeAvis, DepotPermissionsError>> {
    const contexte = await this.getDemandeContexte(demandeAvisId, tx);
    if (!contexte) {
      return failure(DepotPermissionsErrorEnum.DEMANDE_AVIS_NOT_FOUND);
    }

    if (
      !(await this.isMembreActif(
        user.id,
        contexte.instructeurCollectiviteId,
        tx
      ))
    ) {
      return failure(DepotPermissionsErrorEnum.UNAUTHORIZED);
    }

    if (!instructeurCouvreCollectivite(contexte)) {
      return failure(DepotPermissionsErrorEnum.UNAUTHORIZED);
    }

    return success(contexte);
  }

  private async getDemandeContexte(
    demandeAvisId: number,
    tx?: Transaction
  ): Promise<ContexteDemandeAvis | null> {
    const deposante = alias(collectiviteTable, 'deposante');
    const instructrice = alias(collectiviteTable, 'instructrice');

    const rows = await (tx ?? this.databaseService.db)
      .select({
        instructeurCollectiviteId:
          pcaetDemandeAvisTable.instructeurCollectiviteId,
        demarcheStatus: demarcheTable.status,
        avisDeadlineAt: demarcheTable.avisDeadlineAt,
        ...perimetreInstructeurColumns(deposante, instructrice),
      })
      .from(pcaetDemandeAvisTable)
      .innerJoin(
        demarcheTable,
        eq(demarcheTable.id, pcaetDemandeAvisTable.demarcheId)
      )
      .innerJoin(deposante, eq(deposante.id, demarcheTable.collectiviteId))
      .innerJoin(
        instructrice,
        eq(instructrice.id, pcaetDemandeAvisTable.instructeurCollectiviteId)
      )
      .where(eq(pcaetDemandeAvisTable.id, demandeAvisId))
      .limit(1);

    return rows[0] ?? null;
  }

  private async isMembreActif(
    userId: string,
    collectiviteId: number,
    tx?: Transaction
  ): Promise<boolean> {
    const rows = await (tx ?? this.databaseService.db)
      .select({ userId: utilisateurCollectiviteAccessTable.userId })
      .from(utilisateurCollectiviteAccessTable)
      .where(
        and(
          eq(utilisateurCollectiviteAccessTable.userId, userId),
          eq(utilisateurCollectiviteAccessTable.collectiviteId, collectiviteId),
          eq(utilisateurCollectiviteAccessTable.isActive, true)
        )
      )
      .limit(1);

    return rows.length > 0;
  }
}
