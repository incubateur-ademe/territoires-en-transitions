import { Injectable, Logger } from '@nestjs/common';
import { collectiviteTable } from '@tet/backend/collectivites/shared/models/collectivite.table';
import { departementTable } from '@tet/backend/collectivites/shared/models/imports-departement.table';
import { regionTable } from '@tet/backend/collectivites/shared/models/imports-region.table';
import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { getErrorCode } from '@tet/backend/utils/nest/errors.utils';
import { ServiceSecondArg } from '@tet/backend/utils/nest/service-second-arg.utils';
import { PgSyntaxErrorOrAccessRuleViolation } from '@tet/backend/utils/postgresql-error-codes.enum';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import { PermissionOperationEnum, ResourceType } from '@tet/domain/users';
import { asc, eq } from 'drizzle-orm';
import { recetteCollectiviteTable } from '../models/recette-collectivite.table';
import {
  ListCollectivitesError,
  ListCollectivitesErrorEnum,
} from './list-collectivites.errors';
import { RecetteCollectivite } from './list-collectivites.output';

@Injectable()
export class ListCollectivitesService {
  private readonly logger = new Logger(ListCollectivitesService.name);

  constructor(
    private readonly permissionService: PermissionService,
    private readonly databaseService: DatabaseService
  ) {}

  async listCollectivites({
    user,
    tx,
  }: ServiceSecondArg): Promise<
    Result<RecetteCollectivite[], ListCollectivitesError>
  > {
    const permissionResult = await this.permissionService.isAllowed(
      user,
      PermissionOperationEnum['UTILS.BACKOFFICE.READ'],
      ResourceType.PLATEFORME,
      null,
      tx
    );
    if (!permissionResult.success) {
      return failure(ListCollectivitesErrorEnum.UNAUTHORIZED);
    }

    const db = tx ?? this.databaseService.db;
    try {
      const rows = await db
        .select({
          tecCollectiviteId: recetteCollectiviteTable.tecCollectiviteId,
          collectiviteId: recetteCollectiviteTable.tetCollectiviteId,
          nom: recetteCollectiviteTable.nom,
          siren: recetteCollectiviteTable.siren,
          population: recetteCollectiviteTable.population,
          nomTet: collectiviteTable.nom,
          region: regionTable.libelle,
          departement: departementTable.libelle,
        })
        .from(recetteCollectiviteTable)
        .leftJoin(
          collectiviteTable,
          eq(collectiviteTable.id, recetteCollectiviteTable.tetCollectiviteId)
        )
        .leftJoin(
          regionTable,
          eq(regionTable.code, collectiviteTable.regionCode)
        )
        .leftJoin(
          departementTable,
          eq(departementTable.code, collectiviteTable.departementCode)
        )
        .orderBy(asc(recetteCollectiviteTable.nom));
      return success(rows);
    } catch (error) {
      if (
        getErrorCode(error) ===
        PgSyntaxErrorOrAccessRuleViolation.UndefinedTable
      ) {
        return failure(ListCollectivitesErrorEnum.RECETTE_NON_CONSTRUITE);
      }
      this.logger.error(error);
      return failure(ListCollectivitesErrorEnum.DATABASE_ERROR);
    }
  }
}
