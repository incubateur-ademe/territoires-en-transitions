import { Injectable } from '@nestjs/common';
import CrudValeursService from '@tet/backend/indicateurs/valeurs/crud-valeurs.service';
import { indicateurValeurTable } from '@tet/backend/indicateurs/valeurs/indicateur-valeur.table';
import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { ServiceSecondArg } from '@tet/backend/utils/nest/service-second-arg.utils';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import {
  isDemarchePcaetAmontModifiable,
  type PcaetDiagnostic,
} from '@tet/domain/demarches';
import type { IndicateurValeurCreate } from '@tet/domain/indicateurs';
import { PermissionOperationEnum, ResourceType } from '@tet/domain/users';
import { and, eq, inArray } from 'drizzle-orm';
import { DemarchePcaetDiagnosticService } from '../../shared/demarche-pcaet-diagnostic.service';
import { DemarchePcaetRefRepository } from '../../shared/demarche-pcaet-ref.repository';
import { DemarchePcaetSourceMetadonneeRepository } from '../../shared/demarche-pcaet-source-metadonnee.repository';
import {
  UpdateDiagnosticIndicateursValeursErrorEnum,
  type UpdateDiagnosticIndicateursValeursError,
} from './update-diagnostic-indicateurs-valeurs.errors';
import type { UpdateDiagnosticIndicateursValeursInput } from './update-diagnostic-indicateurs-valeurs.input';

const dateValeurForYear = (year: number): string => `${year}-01-01`;

@Injectable()
export class UpdateDiagnosticIndicateursValeursService {
  constructor(
    private readonly permissionService: PermissionService,
    private readonly databaseService: DatabaseService,
    private readonly refRepository: DemarchePcaetRefRepository,
    private readonly sourceMetadonneeRepository: DemarchePcaetSourceMetadonneeRepository,
    private readonly diagnosticService: DemarchePcaetDiagnosticService,
    private readonly crudValeursService: CrudValeursService
  ) {}

  async updateValeurs(
    input: UpdateDiagnosticIndicateursValeursInput,
    { user, tx }: ServiceSecondArg
  ): Promise<Result<PcaetDiagnostic, UpdateDiagnosticIndicateursValeursError>> {
    const { collectiviteId, demarcheId, valeurs } = input;

    for (const operation of [
      PermissionOperationEnum['DEMARCHES.PCAET.MUTATE'],
      PermissionOperationEnum['INDICATEURS.VALEURS.MUTATE'],
    ]) {
      const permissionResult = await this.permissionService.isAllowed(
        user,
        operation,
        ResourceType.COLLECTIVITE,
        { collectiviteId },
        tx
      );
      if (!permissionResult.success) {
        return failure(
          UpdateDiagnosticIndicateursValeursErrorEnum.UNAUTHORIZED
        );
      }
    }

    const ref = await this.refRepository.findRef(
      { demarcheId, collectiviteId },
      undefined,
      tx
    );
    if (!ref) {
      return failure(
        UpdateDiagnosticIndicateursValeursErrorEnum.DEMARCHE_PCAET_NOT_FOUND
      );
    }
    if (!isDemarchePcaetAmontModifiable(ref.status)) {
      return failure(
        UpdateDiagnosticIndicateursValeursErrorEnum.DIAGNOSTIC_NON_MODIFIABLE
      );
    }

    const metadonneeId =
      await this.sourceMetadonneeRepository.getOrCreateMetadonneeId({
        demarcheId,
        collectiviteId,
      });

    const upsertRecords = await this.buildUpsertValeurs({
      collectiviteId,
      metadonneeId,
      valeurs,
    });

    await this.crudValeursService.upsertIndicateurValeurs(upsertRecords, user);

    const payload = await this.diagnosticService.loadPayload(
      { demarcheId, collectiviteId },
      tx
    );

    return success(payload);
  }

  private async buildUpsertValeurs({
    collectiviteId,
    metadonneeId,
    valeurs,
  }: {
    collectiviteId: number;
    metadonneeId: number;
    valeurs: UpdateDiagnosticIndicateursValeursInput['valeurs'];
  }): Promise<IndicateurValeurCreate[]> {
    const byCellKey = new Map<
      string,
      {
        indicateurId: number;
        dateValeur: string;
        resultat?: number | null;
        objectif?: number | null;
      }
    >();

    const indicateurIds = new Set<number>();
    const dateValeurs = new Set<string>();

    for (const valeur of valeurs) {
      const dateValeur = dateValeurForYear(valeur.year);
      const key = `${valeur.indicateurId}:${dateValeur}`;

      indicateurIds.add(valeur.indicateurId);
      dateValeurs.add(dateValeur);

      const current = byCellKey.get(key);
      if (!current) {
        byCellKey.set(key, {
          indicateurId: valeur.indicateurId,
          dateValeur,
        });
      }

      const entry = byCellKey.get(key);
      if (!entry) {
        continue;
      }
      if (valeur.field === 'resultat') {
        entry.resultat = valeur.value;
      } else {
        entry.objectif = valeur.value;
      }
    }

    const existingRows = await this.databaseService.db
      .select({
        indicateurId: indicateurValeurTable.indicateurId,
        dateValeur: indicateurValeurTable.dateValeur,
        resultat: indicateurValeurTable.resultat,
        objectif: indicateurValeurTable.objectif,
        resultatCommentaire: indicateurValeurTable.resultatCommentaire,
        objectifCommentaire: indicateurValeurTable.objectifCommentaire,
        calculAuto: indicateurValeurTable.calculAuto,
        calculAutoIdentifiantsManquants:
          indicateurValeurTable.calculAutoIdentifiantsManquants,
      })
      .from(indicateurValeurTable)
      .where(
        and(
          eq(indicateurValeurTable.collectiviteId, collectiviteId),
          eq(indicateurValeurTable.metadonneeId, metadonneeId),
          inArray(indicateurValeurTable.indicateurId, [...indicateurIds]),
          inArray(indicateurValeurTable.dateValeur, [...dateValeurs])
        )
      );

    const existingByKey = new Map<string, (typeof existingRows)[number]>(
      existingRows.map((row) => [`${row.indicateurId}:${row.dateValeur}`, row])
    );

    const nowValues: IndicateurValeurCreate[] = [];

    for (const entry of byCellKey.values()) {
      const key = `${entry.indicateurId}:${entry.dateValeur}`;
      const existing = existingByKey.get(key);

      const resultat = entry.resultat ?? existing?.resultat ?? null;
      const objectif = entry.objectif ?? existing?.objectif ?? null;

      const upsert: IndicateurValeurCreate = {
        collectiviteId,
        indicateurId: entry.indicateurId,
        dateValeur: entry.dateValeur,
        metadonneeId,
        resultat,
        objectif,
        resultatCommentaire: existing?.resultatCommentaire ?? null,
        objectifCommentaire: existing?.objectifCommentaire ?? null,
        calculAuto: existing?.calculAuto ?? false,
        calculAutoIdentifiantsManquants:
          existing?.calculAutoIdentifiantsManquants ?? null,
      };

      nowValues.push(upsert);
    }

    return nowValues;
  }
}
