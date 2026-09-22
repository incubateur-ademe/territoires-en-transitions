import { Injectable } from '@nestjs/common';
import { collectiviteTable } from '@tet/backend/collectivites/shared/models/collectivite.table';
import { demarcheTable } from '@tet/backend/demarches/shared/models/demarche.table';
import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import { utilisateurCollectiviteAccessTable } from '@tet/backend/users/authorizations/utilisateur-collectivite-access.table';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { ServiceSecondArg } from '@tet/backend/utils/nest/service-second-arg.utils';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import type { CollectiviteType } from '@tet/domain/collectivites';
import {
  DemarchePcaetStatusEnum,
  DemarcheTypeEnum,
  fenetreAvisOuverte,
  getPerimetreSaisine,
  instructeurCouvreCollectivite,
  isTypeInstructeur,
  PcaetPerimetreSaisineEnum,
  peutDeposerAvisSaisine,
  typesInstructeur,
  type FenetreAvisEntree,
  type PcaetPerimetreSaisine,
  type PerimetreInstructeurEntree,
} from '@tet/domain/demarches';
import { PermissionOperationEnum, ResourceType } from '@tet/domain/users';
import { and, eq, inArray } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import {
  DepotPermissionsError,
  DepotPermissionsErrorEnum,
} from './depot-permissions.errors';
import type { DossierInstructionRef } from './dossier-instruction-ref.input';
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
  FenetreAvisEntree & {
    demarcheId: number;
    /** La déposante : celle dont le dossier porte les pièces et le diagnostic. */
    collectiviteId: number;
    instructeurCollectiviteId: number;
    /**
     * Le territoire de la déposante qui vaut cette saisine. Un service atteint
     * par un périmètre secondaire lit le dossier sans s'y prononcer.
     */
    perimetre: PcaetPerimetreSaisine;
  };

/**
 * Un dossier que l'utilisateur peut lire, et à quel titre.
 *
 * La forme commune aux deux clés de `DossierInstructionRef` : les lectures du
 * dossier — en-tête, pièces, diagnostic — n'ont pas à savoir si elles y
 * accèdent par une saisine ou par le périmètre.
 */
export type DossierConsultable = {
  demarcheId: number;
  collectiviteId: number;
  /** `null` quand le dossier se lit sans saisine : un dépôt en élaboration. */
  demandeAvisId: number | null;
  instructeurCollectiviteId: number;
  instructeurType: CollectiviteType;
  perimetre: PcaetPerimetreSaisine;
};

/** Un service de l'utilisateur qui couvre une collectivité, saisi ou non. */
export type ServiceCouvrant = {
  collectiviteId: number;
  nom: string;
  type: CollectiviteType;
  perimetre: PcaetPerimetreSaisine;
};

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
   * Peut-on lire ce dossier, par la clé qu'on en a ?
   *
   * Par la saisine : les barrières de `canConsulterDepot`. Par la démarche :
   * celles de `canConsulterDemarche`. Rend dans les deux cas de quoi charger le
   * dossier — démarche, déposante, et le service au titre duquel on lit.
   */
  async canConsulterDossier(
    ref: DossierInstructionRef,
    { user, tx }: ServiceSecondArg
  ): Promise<Result<DossierConsultable, DepotPermissionsError>> {
    if ('demarcheId' in ref) {
      return this.canConsulterDemarche(ref.demarcheId, { user, tx });
    }

    const contexteResult = await this.resolveContexteInstruction(
      ref.demandeAvisId,
      { user, tx }
    );
    if (!contexteResult.success) {
      return failure(contexteResult.error);
    }
    const contexte = contexteResult.data;

    return success({
      demarcheId: contexte.demarcheId,
      collectiviteId: contexte.collectiviteId,
      demandeAvisId: ref.demandeAvisId,
      instructeurCollectiviteId: contexte.instructeurCollectiviteId,
      instructeurType: contexte.instructeurType,
      perimetre: contexte.perimetre,
    });
  }

  /**
   * Peut-on lire un dépôt **en élaboration**, qui n'a encore saisi personne ?
   *
   * Le droit vient du périmètre : l'utilisateur est membre actif d'un service
   * instructeur qui couvre la déposante — celui-là même que la transmission
   * saisira. Il lit le dossier tel qu'il est, sans rien y déposer.
   *
   * Passé la transmission, cette porte se ferme : c'est la saisine qui ouvre le
   * dossier, et un service transmis sans saisine n'a rien à y lire. Sans quoi la
   * saisine ne garderait plus rien, puisque le périmètre l'englobe.
   */
  async canConsulterDemarche(
    demarcheId: number,
    { user, tx }: ServiceSecondArg
  ): Promise<Result<DossierConsultable, DepotPermissionsError>> {
    const rows = await (tx ?? this.databaseService.db)
      .select({
        collectiviteId: demarcheTable.collectiviteId,
        status: demarcheTable.status,
      })
      .from(demarcheTable)
      .where(
        and(
          eq(demarcheTable.id, demarcheId),
          eq(demarcheTable.type, DemarcheTypeEnum.PCAET)
        )
      )
      .limit(1);

    // L'erreur commune, et non une erreur propre : les mutations d'avis
    // reprennent ce contrat dans le leur, une erreur de plus les obligerait
    // toutes à la nommer. Les lectures qui l'attendent la traduisent.
    const demarche = rows[0];
    if (!demarche) {
      return failure(DepotPermissionsErrorEnum.NOT_FOUND);
    }
    if (demarche.status !== DemarchePcaetStatusEnum.EN_ELABORATION) {
      return failure(DepotPermissionsErrorEnum.UNAUTHORIZED);
    }

    const [service] = await this.listServicesCouvrants(
      user.id,
      demarche.collectiviteId,
      tx
    );
    if (!service) {
      return failure(DepotPermissionsErrorEnum.UNAUTHORIZED);
    }

    return success({
      demarcheId,
      collectiviteId: demarche.collectiviteId,
      demandeAvisId: null,
      instructeurCollectiviteId: service.collectiviteId,
      instructeurType: service.type,
      perimetre: service.perimetre,
    });
  }

  /**
   * Les services instructeurs dont l'utilisateur est membre actif et qui
   * couvrent cette collectivité, saisine ou non.
   *
   * Principal d'abord — le plus favorable, un droit ne se perd pas sur une
   * ambiguïté — puis par identifiant, pour que la réponse ne dépende pas de
   * l'ordre de lecture. La couverture se juge dans le domaine, comme pour les
   * saisines : la règle est la même, elle se lit au même endroit.
   */
  async listServicesCouvrants(
    userId: string,
    collectiviteId: number,
    tx?: Transaction
  ): Promise<ServiceCouvrant[]> {
    const deposante = alias(collectiviteTable, 'deposante');
    const instructrice = alias(collectiviteTable, 'instructrice');

    const rows = await (tx ?? this.databaseService.db)
      .select({
        collectiviteId: instructrice.id,
        nom: instructrice.nom,
        // Le siège de la déposante, à part de ses territoires secondaires : ce
        // qui départage une saisine principale d'une secondaire.
        collectiviteRegionCode: deposante.regionCode,
        collectiviteDepartementCode: deposante.departementCode,
        ...perimetreInstructeurColumns(deposante, instructrice),
      })
      .from(utilisateurCollectiviteAccessTable)
      .innerJoin(
        instructrice,
        eq(instructrice.id, utilisateurCollectiviteAccessTable.collectiviteId)
      )
      .innerJoin(deposante, eq(deposante.id, collectiviteId))
      .where(
        and(
          eq(utilisateurCollectiviteAccessTable.userId, userId),
          eq(utilisateurCollectiviteAccessTable.isActive, true),
          inArray(instructrice.type, [...typesInstructeur])
        )
      );

    return rows
      .flatMap((row) => {
        const perimetre = getPerimetreSaisine(row);
        return perimetre === null
          ? []
          : [
              {
                collectiviteId: row.collectiviteId,
                nom: row.nom,
                type: row.instructeurType,
                perimetre,
              },
            ];
      })
      .sort((a, b) =>
        a.perimetre === b.perimetre
          ? a.collectiviteId - b.collectiviteId
          : a.perimetre === PcaetPerimetreSaisineEnum.PRINCIPAL
          ? -1
          : 1
      );
  }

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
  ): Promise<Result<void, DepotPermissionsError>> {
    const saisines = await this.listSaisinesDeLaDemarche(
      demandeAvisId,
      user.id,
      tx
    );
    if (!saisines.some(instructeurCouvreCollectivite)) {
      return failure(DepotPermissionsErrorEnum.UNAUTHORIZED);
    }

    return success(undefined);
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

  /**
   * Rend le contexte de l'instruction : l'appelant qui choisit un titre d'avis y
   * lit le type de l'instructeur pour vérifier qu'il en répond bien.
   */
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

    // Tous les destinataires d'une transmission ne sont pas saisis pour avis.
    // Deux choses ferment le dépôt, et aucun rôle ne les ouvre : la famille du
    // service — la DDT, la DR ADEME et les services nationaux reçoivent le
    // dossier en lecture — et le territoire qui vaut la saisine. Une DREAL
    // atteinte par un périmètre secondaire de la déposante lit le dossier :
    // l'avis du préfet de région revient à celle du siège.
    if (
      !peutDeposerAvisSaisine(contexte.instructeurType, contexte.perimetre)
    ) {
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
        demarcheId: demarcheTable.id,
        collectiviteId: demarcheTable.collectiviteId,
        instructeurCollectiviteId:
          pcaetDemandeAvisTable.instructeurCollectiviteId,
        perimetre: pcaetDemandeAvisTable.perimetre,
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
