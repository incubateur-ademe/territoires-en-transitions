import { round } from 'es-toolkit';
import { Injectable } from '@nestjs/common';
import { CollectiviteReferentielModeService } from '@tet/backend/collectivites/collectivite-referentiel-mode/collectivite-referentiel-mode.service';
import CollectivitesService from '@tet/backend/collectivites/services/collectivites.service';
import { LIST_DEFAULT_JALONS } from '@tet/backend/referentiels/snapshots/list-snapshots/list-snapshots.api-query';
import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { createdByNom, dcpTable } from '@tet/backend/users/models/dcp.table';
import { sqlToDate, sqlToDateTimeISO } from '@tet/backend/utils/column.utils';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import {
  referentielIdEnumSchema,
  ScoreSnapshot,
  SnapshotJalonEnum,
  snapshotJalonEnumSchema,
} from '@tet/domain/referentiels';
import { and, desc, eq, inArray } from 'drizzle-orm';
import z from 'zod';
import { snapshotTable } from '../snapshot.table';
import { isCollectiviteReferentielPreferenceId } from '@tet/domain/collectivites';
import { ResourceType } from '@tet/domain/users';

export const listInputSchema = z.object({
  referentielId: referentielIdEnumSchema,
  collectiviteId: z.number().int(),
  options: z
    .object({
      jalons: snapshotJalonEnumSchema
        .array()
        .optional()
        .default(LIST_DEFAULT_JALONS),
    })
    .optional()
    .default({
      jalons: LIST_DEFAULT_JALONS,
    }),
});

type ListInput = z.output<typeof listInputSchema>;

@Injectable()
export class ListSnapshotsService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly collectiviteReferentielModeService: CollectiviteReferentielModeService,
    private readonly collectivitesService: CollectivitesService,
    private readonly permissionService: PermissionService
  ) {}
  private readonly db = this.databaseService.db;

  async listWithScores({
    collectiviteId,
    referentielId,
    options: { jalons },
  }: ListInput): Promise<ScoreSnapshot[]> {
    const effectiveJalons = await this.getEffectiveJalons(
      collectiviteId,
      referentielId,
      jalons
    );
    const filters = [
      eq(snapshotTable.collectiviteId, collectiviteId),
      eq(snapshotTable.referentielId, referentielId),
    ];

    if (effectiveJalons) {
      filters.push(inArray(snapshotTable.jalon, effectiveJalons));
    }

    const snapshots = await this.databaseService.db
      .select()
      .from(snapshotTable)
      .where(and(...filters))
      .orderBy(desc(snapshotTable.date));

    return snapshots as ScoreSnapshot[];
  }

  /**
   * L'auteur d'une sauvegarde manuelle n'est renvoyé qu'avec un `user` autorisé
   * à voir les membres (jamais par l'API REST publique) : son nom vient de `dcp`.
   */
  async list(
    {
      collectiviteId,
      referentielId,
      options: { jalons },
    }: ListInput & {
      additionalSelectColumns?: Parameters<DatabaseService['db']['select']>[0];
    },
    { user }: { user?: AuthenticatedUser } = {}
  ) {
    const effectiveJalons = await this.getEffectiveJalons(
      collectiviteId,
      referentielId,
      jalons
    );
    const filters = [
      eq(snapshotTable.collectiviteId, collectiviteId),
      eq(snapshotTable.referentielId, referentielId),
    ];

    if (effectiveJalons) {
      filters.push(inArray(snapshotTable.jalon, effectiveJalons));
    }

    // Dynamically build the selection based on withScores flag
    const columns = {
      ref: snapshotTable.ref,
      nom: snapshotTable.nom,
      date: sqlToDate(snapshotTable.date),
      jalon: snapshotTable.jalon,
      pointFait: snapshotTable.pointFait,
      pointProgramme: snapshotTable.pointProgramme,
      pointPasFait: snapshotTable.pointPasFait,
      pointPotentiel: snapshotTable.pointPotentiel,
      referentielVersion: snapshotTable.referentielVersion,
      auditId: snapshotTable.auditId,
      createdAt: sqlToDateTimeISO(snapshotTable.createdAt),
      createdBy: snapshotTable.createdBy,
      modifiedAt: sqlToDateTimeISO(snapshotTable.modifiedAt),
      modifiedBy: snapshotTable.modifiedBy,
      createdByName: createdByNom.as('created_by_name'),
    } as const;

    const snapshotList = await this.databaseService.db
      .select(columns)
      .from(snapshotTable)
      .leftJoin(dcpTable, eq(dcpTable.id, snapshotTable.createdBy))
      .where(and(...filters))
      .orderBy(desc(snapshotTable.date));

    const isManualWithCreator = (snapshot: (typeof snapshotList)[number]) =>
      snapshot.jalon === SnapshotJalonEnum.DATE_PERSONNALISEE &&
      snapshot.createdBy !== null;

    const canReadCreatedBy =
      user && snapshotList.some(isManualWithCreator)
        ? await this.canReadMembres(user, collectiviteId)
        : false;

    const response = {
      collectiviteId: parseInt(collectiviteId as unknown as string),
      referentielId,
      jalons: effectiveJalons ?? [],
      snapshots: snapshotList.map((row) => {
        const { createdByName, ...snapshot } = row;
        const baseSnapshot = {
          ...snapshot,
          createdByName:
            canReadCreatedBy && isManualWithCreator(row)
              ? createdByName
              : undefined,
          pointNonRenseigne:
            round(
              snapshot.pointPotentiel -
                (snapshot.pointFait +
                  snapshot.pointPasFait +
                  snapshot.pointProgramme),
              2
            ) || undefined,
        };

        return baseSnapshot;
      }),
    };

    return response;
  }

  /** Même arbitrage que la liste des membres, qui expose aussi les noms lus dans `dcp`. */
  private async canReadMembres(
    user: AuthenticatedUser,
    collectiviteId: number
  ): Promise<boolean> {
    // Une collectivité introuvable ne doit pas casser la liste : le nom est
    // simplement omis.
    const accesRestreint = await this.collectivitesService
      .isPrivate(collectiviteId)
      .catch(() => null);
    if (accesRestreint === null) {
      return false;
    }
    const permission = await this.permissionService.isAllowed(
      user,
      accesRestreint
        ? 'collectivites.read_confidentiel'
        : 'collectivites.membres.read',
      ResourceType.COLLECTIVITE,
      { collectiviteId }
    );
    return permission.success;
  }

  private async getEffectiveJalons(
    collectiviteId: number,
    referentielId: ListInput['referentielId'],
    jalons: ListInput['options']['jalons']
  ) {
    if (!isCollectiviteReferentielPreferenceId(referentielId)) {
      return jalons;
    }

    const referentielModeResult =
      await this.collectiviteReferentielModeService.getReferentielMode(
        collectiviteId,
        referentielId
      );

    if (!referentielModeResult.success) {
      return jalons;
    }

    if (referentielModeResult.data !== 'archived') {
      return jalons;
    }

    return jalons.filter((jalon) => jalon !== SnapshotJalonEnum.COURANT);
  }
}
