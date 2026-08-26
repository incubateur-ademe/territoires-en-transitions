import { Injectable } from '@nestjs/common';
import { collectiviteTable } from '@tet/backend/collectivites/shared/models/collectivite.table';
import { demarcheTable } from '@tet/backend/demarches/shared/models/demarche.table';
import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { ServiceSecondArg } from '@tet/backend/utils/nest/service-second-arg.utils';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import { DemarcheTypeEnum } from '@tet/domain/demarches';
import { PermissionOperationEnum, ResourceType } from '@tet/domain/users';
import { and, asc, eq, isNotNull } from 'drizzle-orm';
import { pcaetAvisTable } from '../shared/models/pcaet-avis.table';
import { pcaetDemandeAvisTable } from '../shared/models/pcaet-demande-avis.table';
import {
  ListAvisRecusError,
  ListAvisRecusErrorEnum,
} from './list-avis-recus.errors';
import { ListAvisRecusInput } from './list-avis-recus.input';
import { AvisRecu } from './list-avis-recus.output';

/**
 * Les avis rendus sur le dossier, lus par la collectivité déposante.
 *
 * Le pendant de l'espace d'instruction, de l'autre côté : les routes `avis`
 * existantes exigent d'être membre de la collectivité **instructrice**, ce qui
 * laissait la déposante sans aucun moyen de lire les avis qu'elle avait reçus —
 * seul le mail d'envoi les lui signalait, sans même en porter le sens.
 */
@Injectable()
export class ListAvisRecusService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly permissionService: PermissionService
  ) {}

  async listAvisRecus(
    { collectiviteId, demarcheId }: ListAvisRecusInput,
    { user, tx }: ServiceSecondArg
  ): Promise<Result<AvisRecu[], ListAvisRecusError>> {
    const permissionResult = await this.permissionService.isAllowed(
      user,
      PermissionOperationEnum['DEMARCHES.PCAET.MUTATE'],
      ResourceType.COLLECTIVITE,
      { collectiviteId },
      tx
    );
    if (!permissionResult.success) {
      return failure(ListAvisRecusErrorEnum.UNAUTHORIZED);
    }

    const db = tx ?? this.databaseService.db;

    // Le couple (démarche, collectivité) est vérifié en base plutôt que déduit
    // de l'entrée : sans quoi l'identifiant d'une démarche d'une autre
    // collectivité passerait la barrière de permission ci-dessus.
    const [demarche] = await db
      .select({ id: demarcheTable.id })
      .from(demarcheTable)
      .where(
        and(
          eq(demarcheTable.id, demarcheId),
          eq(demarcheTable.collectiviteId, collectiviteId),
          eq(demarcheTable.type, DemarcheTypeEnum.PCAET)
        )
      )
      .limit(1);
    if (!demarche) {
      return failure(ListAvisRecusErrorEnum.DEMARCHE_PCAET_NOT_FOUND);
    }

    const rows = await db
      .select({
        id: pcaetAvisTable.id,
        demandeAvisId: pcaetAvisTable.demandeAvisId,
        auTitreDe: pcaetAvisTable.auTitreDe,
        sens: pcaetAvisTable.sens,
        fichierRef: pcaetAvisTable.fichierRef,
        valideLe: pcaetAvisTable.valideLe,
        envoyeLe: pcaetAvisTable.envoyeLe,
        instructeurNom: collectiviteTable.nom,
      })
      .from(pcaetAvisTable)
      .innerJoin(
        pcaetDemandeAvisTable,
        eq(pcaetDemandeAvisTable.id, pcaetAvisTable.demandeAvisId)
      )
      .innerJoin(
        collectiviteTable,
        eq(collectiviteTable.id, pcaetAvisTable.emetteurCollectiviteId)
      )
      .where(
        and(
          eq(pcaetDemandeAvisTable.demarcheId, demarche.id),
          // Les brouillons de l'instructeur ne sortent pas de son espace : un
          // avis n'existe pour la collectivité qu'une fois validé.
          isNotNull(pcaetAvisTable.valideLe)
        )
      )
      .orderBy(asc(pcaetAvisTable.valideLe), asc(pcaetAvisTable.auTitreDe));

    return success(
      rows.map((row) => ({
        id: row.id,
        demandeAvisId: row.demandeAvisId,
        auTitreDe: row.auTitreDe,
        sens: row.sens,
        aUnRapport: row.fichierRef !== null,
        // Non nul par le filtre ci-dessus.
        valideLe: (row.valideLe as unknown as string) ?? '',
        envoyeLe: (row.envoyeLe as unknown as string) ?? null,
        instructeurNom: row.instructeurNom ?? '',
      }))
    );
  }
}
