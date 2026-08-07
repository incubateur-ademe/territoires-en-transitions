import { Injectable } from '@nestjs/common';
import { collectiviteTable } from '@tet/backend/collectivites/shared/models/collectivite.table';
import { demarcheTable } from '@tet/backend/demarches/shared/models/demarche.table';
import { utilisateurCollectiviteAccessTable } from '@tet/backend/users/authorizations/utilisateur-collectivite-access.table';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { ServiceSecondArg } from '@tet/backend/utils/nest/service-second-arg.utils';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import {
  fenetreAvisOuverte,
  instructeurCouvreCollectivite,
} from '@tet/domain/demarches';
import { and, eq } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import {
  DepotPermissionsError,
  DepotPermissionsErrorEnum,
} from './depot-permissions.errors';
import { pcaetDemandeAvisTable } from './models/pcaet-demande-avis.table';

@Injectable()
export class DepotPermissionsService {
  constructor(private readonly databaseService: DatabaseService) {}

  async canConsulterDepot(
    demandeAvisId: number,
    { user, tx }: ServiceSecondArg
  ): Promise<Result<void, DepotPermissionsError>> {
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

    return success(undefined);
  }

  async canDeposerAvis(
    demandeAvisId: number,
    { user, tx }: ServiceSecondArg
  ): Promise<Result<void, DepotPermissionsError>> {
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

    if (!fenetreAvisOuverte(contexte, new Date())) {
      return failure(DepotPermissionsErrorEnum.UNAUTHORIZED);
    }

    return success(undefined);
  }

  private async getDemandeContexte(demandeAvisId: number, tx?: Transaction) {
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
