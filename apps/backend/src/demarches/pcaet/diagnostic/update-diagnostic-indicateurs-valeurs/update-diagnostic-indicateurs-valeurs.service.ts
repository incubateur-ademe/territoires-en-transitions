import { Injectable } from '@nestjs/common';
import { indicateurSourceMetadonneeTable } from '@tet/backend/indicateurs/shared/models/indicateur-source-metadonnee.table';
import { indicateurSourceTable } from '@tet/backend/indicateurs/shared/models/indicateur-source.table';
import CrudValeursService from '@tet/backend/indicateurs/valeurs/crud-valeurs.service';
import { indicateurValeurTable } from '@tet/backend/indicateurs/valeurs/indicateur-valeur.table';
import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { ServiceSecondArg } from '@tet/backend/utils/nest/service-second-arg.utils';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import {
  isDemarchePcaetAmontModifiable,
  type DemarchePcaetDiagnostic,
} from '@tet/domain/demarches';
import type { IndicateurValeurCreate } from '@tet/domain/indicateurs';
import { PermissionOperationEnum, ResourceType } from '@tet/domain/users';
import { and, eq, inArray } from 'drizzle-orm';
import { DemarchePcaetDiagnosticService } from '../../shared/demarche-pcaet-diagnostic.service';
import { DemarchePcaetRefRepository } from '../../shared/demarche-pcaet-ref.repository';
import { demarchePcaetSourceMetadonneeTable } from '../../shared/models/demarche-pcaet-source-metadonnee.table';
import {
  UpdateDiagnosticIndicateursValeursErrorEnum,
  type UpdateDiagnosticIndicateursValeursError,
} from './update-diagnostic-indicateurs-valeurs.errors';
import type { UpdateDiagnosticIndicateursValeursInput } from './update-diagnostic-indicateurs-valeurs.input';

const PCAET_COLLECTIVITE_SOURCE_ID = 'pcaet-collectivite';
const PCAET_COLLECTIVITE_SOURCE_LABEL = 'PCAET collectivité';

const dateValeurForYear = (year: number): string => `${year}-01-01`;

@Injectable()
export class UpdateDiagnosticIndicateursValeursService {
  constructor(
    private readonly permissionService: PermissionService,
    private readonly databaseService: DatabaseService,
    private readonly refRepository: DemarchePcaetRefRepository,
    private readonly diagnosticService: DemarchePcaetDiagnosticService,
    private readonly crudValeursService: CrudValeursService
  ) {}

  async updateValeurs(
    input: UpdateDiagnosticIndicateursValeursInput,
    { user, tx }: ServiceSecondArg
  ): Promise<
    Result<DemarchePcaetDiagnostic, UpdateDiagnosticIndicateursValeursError>
  > {
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

    const metadonneeId = await this.getOrCreatePcaetSourceMetadonneeId({
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

  /**
   * Un identifiant de métadonnée dépend uniquement de (démarche, collectivité).
   * On crée tout à la volée si nécessaire.
   */
  private async getOrCreatePcaetSourceMetadonneeId({
    demarcheId,
    collectiviteId,
  }: {
    demarcheId: number;
    collectiviteId: number;
  }): Promise<number> {
    const [existing] = await this.databaseService.db
      .select({ metadonneeId: demarchePcaetSourceMetadonneeTable.metadonneeId })
      .from(demarchePcaetSourceMetadonneeTable)
      .where(
        and(
          eq(demarchePcaetSourceMetadonneeTable.demarcheId, demarcheId),
          eq(demarchePcaetSourceMetadonneeTable.collectiviteId, collectiviteId)
        )
      )
      .limit(1);

    if (existing?.metadonneeId) {
      return existing.metadonneeId;
    }

    // La source PCAET existe côté métadonnées indicateurs : on l'upsert pour
    // que `indicateur_source_metadonnee.source_id` soit toujours resolvable.
    await this.databaseService.db
      .insert(indicateurSourceTable)
      .values({
        id: PCAET_COLLECTIVITE_SOURCE_ID,
        libelle: PCAET_COLLECTIVITE_SOURCE_LABEL,
        ordreAffichage: null,
      })
      .onConflictDoUpdate({
        target: indicateurSourceTable.id,
        set: { libelle: PCAET_COLLECTIVITE_SOURCE_LABEL },
      });

    const [metadonnee] = await this.databaseService.db
      .insert(indicateurSourceMetadonneeTable)
      .values({
        sourceId: PCAET_COLLECTIVITE_SOURCE_ID,
        dateVersion: new Date().toISOString(),
        nomDonnees: null,
        diffuseur: null,
        producteur: null,
        methodologie: null,
        limites: null,
      })
      .returning({ id: indicateurSourceMetadonneeTable.id });

    await this.databaseService.db
      .insert(demarchePcaetSourceMetadonneeTable)
      .values({
        demarcheId,
        collectiviteId,
        metadonneeId: metadonnee.id,
      })
      .onConflictDoNothing();

    const [link] = await this.databaseService.db
      .select({ metadonneeId: demarchePcaetSourceMetadonneeTable.metadonneeId })
      .from(demarchePcaetSourceMetadonneeTable)
      .where(
        and(
          eq(demarchePcaetSourceMetadonneeTable.demarcheId, demarcheId),
          eq(demarchePcaetSourceMetadonneeTable.collectiviteId, collectiviteId)
        )
      )
      .limit(1);

    return link?.metadonneeId ?? metadonnee.id;
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
