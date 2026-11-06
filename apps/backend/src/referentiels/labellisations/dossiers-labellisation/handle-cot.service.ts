import { Injectable } from '@nestjs/common';
import { collectiviteTable } from '@tet/backend/collectivites/shared/models/collectivite.table';
import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { ServiceSecondArg } from '@tet/backend/utils/nest/service-second-arg.utils';
import { failure, success } from '@tet/backend/utils/result.type';
import { asc, eq, ilike } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import { cotTable } from '../cot.table';
import { checkLabellisationsAdmin } from './check-labellisations-admin.utils';
import { DossiersLabellisationErrorEnum } from './dossiers-labellisation.errors';
import { ToggleCotActifInput } from './dossiers-labellisation.input';

const signataireTable = alias(collectiviteTable, 'signataire');

@Injectable()
export class HandleCotService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly permissionService: PermissionService
  ) {}

  private readonly db = this.databaseService.db;

  async listCot({ search }: { search?: string }, { user }: ServiceSecondArg) {
    if (!(await this.isAllowed(user))) {
      return failure(DossiersLabellisationErrorEnum.UNAUTHORIZED);
    }

    const rows = await this.db
      .select({
        collectiviteId: cotTable.collectiviteId,
        collectiviteNom: collectiviteTable.nom,
        actif: cotTable.actif,
        signataireNom: signataireTable.nom,
      })
      .from(cotTable)
      .innerJoin(
        collectiviteTable,
        eq(collectiviteTable.id, cotTable.collectiviteId)
      )
      .leftJoin(signataireTable, eq(signataireTable.id, cotTable.signataire))
      .where(search ? ilike(collectiviteTable.nom, `%${search}%`) : undefined)
      .orderBy(asc(collectiviteTable.nom));

    return success(rows);
  }

  async toggleCotActif(
    { collectiviteId, actif }: ToggleCotActifInput,
    { user }: ServiceSecondArg
  ) {
    if (!(await this.isAllowed(user))) {
      return failure(DossiersLabellisationErrorEnum.UNAUTHORIZED);
    }

    const updated = await this.db
      .update(cotTable)
      .set({ actif })
      .where(eq(cotTable.collectiviteId, collectiviteId))
      .returning({ collectiviteId: cotTable.collectiviteId });
    if (!updated.length) {
      return failure(DossiersLabellisationErrorEnum.COT_NOT_FOUND);
    }

    return success(undefined);
  }

  private async isAllowed(user: ServiceSecondArg['user']) {
    const result = await checkLabellisationsAdmin(this.permissionService, user);
    return result.success;
  }
}
