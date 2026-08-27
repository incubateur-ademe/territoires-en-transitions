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

type ContexteInstruction = PerimetreInstructeurEntree &
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
    const contexteResult = await this.resolveContexteInstruction(demandeAvisId, {
      user,
      tx,
    });
    if (!contexteResult.success) {
      return failure(contexteResult.error);
    }

    return success(undefined);
  }

  async canDeposerAvis(
    demandeAvisId: number,
    { user, tx }: ServiceSecondArg
  ): Promise<Result<void, DepotPermissionsError>> {
    const contexteResult = await this.resolveContexteInstruction(demandeAvisId, {
      user,
      tx,
    });
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

    return success(undefined);
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
  ): Promise<Result<ContexteInstruction, DepotPermissionsError>> {
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
  ): Promise<ContexteInstruction | null> {
    const deposante = alias(collectiviteTable, 'deposante');
    const instructrice = alias(collectiviteTable, 'instructrice');

    const rows = await (tx ?? this.databaseService.db)
      .select({
        instructeurCollectiviteId:
          pcaetDemandeAvisTable.instructeurCollectiviteId,
        demarcheStatus: demarcheTable.status,
        avisDeadlineAt: demarcheTable.avisDeadlineAt,
        instructeurType: instructrice.type,
        instructeurRegionCode: instructrice.regionCode,
        instructeurDepartementCode: instructrice.departementCode,
        collectiviteRegionCode: deposante.regionCode,
        collectiviteDepartementCode: deposante.departementCode,
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
