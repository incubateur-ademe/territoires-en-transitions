import { Injectable, Logger } from '@nestjs/common';
import { collectiviteTable } from '@tet/backend/collectivites/shared/models/collectivite.table';
import { demarcheTable } from '@tet/backend/demarches/shared/models/demarche.table';
import { dcpTable } from '@tet/backend/users/models/dcp.table';
import { utilisateurCollectiviteAccessTable } from '@tet/backend/users/authorizations/utilisateur-collectivite-access.table';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import {
  getPerimetreInstructeur,
  PerimetreInstructeurEnum,
} from '@tet/domain/demarches';
import type { CollectiviteType } from '@tet/domain/collectivites';
import { CollectiviteRole } from '@tet/domain/users';
import { and, eq, inArray, sql, type SQL } from 'drizzle-orm';
import { pcaetAvisTable } from '../shared/models/pcaet-avis.table';
import { pcaetDemandeAvisTable } from '../shared/models/pcaet-demande-avis.table';
import type { DemarchePcaetStatus } from '@tet/domain/demarches';
import {
  ListDemandesAvisError,
  ListDemandesAvisErrorEnum,
} from './list-demandes-avis.errors';
import type { DemandeAvisContact } from './list-demandes-avis.output';

export type DemandeAvisRow = {
  demandeAvisId: number;
  demarcheId: number;
  demarcheTitre: string;
  demarcheStatus: DemarchePcaetStatus;
  avisDeadlineAt: string | null;
  transmittedAt: string | null;
  collectiviteId: number;
  collectiviteNom: string;
  collectiviteDepartementCode: string | null;
  nbAvisValides: number;
  nbAvisBrouillons: number;
  /**
   * Validation du dernier avis rendu sur la demande, `null` si aucun ne l'est.
   * Avec `transmittedAt`, c'est ce qui mesure la durée d'une instruction.
   */
  dernierAvisValideLe: string | null;
};

@Injectable()
export class ListDemandesAvisRepository {
  private readonly logger = new Logger(ListDemandesAvisRepository.name);

  constructor(private readonly databaseService: DatabaseService) {}

  /**
   * Les demandes couvertes par ce service, **et sa famille** : l'appelant en a
   * besoin pour savoir si le statut d'une ligne se lit sur la demande — un
   * service qui dépose un avis — ou sur le dossier entier.
   */
  async listDemandesCouvertes(
    instructeurCollectiviteId: number,
    tx?: Transaction
  ): Promise<
    Result<
      { instructeurType: CollectiviteType; rows: DemandeAvisRow[] },
      ListDemandesAvisError
    >
  > {
    const db = tx ?? this.databaseService.db;

    try {
      const instructrices = await db
        .select({
          type: collectiviteTable.type,
          regionCode: collectiviteTable.regionCode,
          departementCode: collectiviteTable.departementCode,
        })
        .from(collectiviteTable)
        .where(eq(collectiviteTable.id, instructeurCollectiviteId))
        .limit(1);

      const instructrice = instructrices[0];
      if (!instructrice) {
        return success({ instructeurType: 'test', rows: [] });
      }

      const perimetre = getPerimetreInstructeur(instructrice.type);
      if (!perimetre) {
        return success({ instructeurType: instructrice.type, rows: [] });
      }

      // Aucun filtre au national : le service voit toutes les déposantes.
      // Ailleurs, un code manquant côté service ne couvre personne.
      let filtrePerimetre: SQL | undefined;
      if (perimetre !== PerimetreInstructeurEnum.NATIONAL) {
        const codeInstructrice =
          perimetre === PerimetreInstructeurEnum.REGION
            ? instructrice.regionCode
            : instructrice.departementCode;

        if (!codeInstructrice) {
          return success({ instructeurType: instructrice.type, rows: [] });
        }

        filtrePerimetre = eq(
          perimetre === PerimetreInstructeurEnum.REGION
            ? collectiviteTable.regionCode
            : collectiviteTable.departementCode,
          codeInstructrice
        );
      }

      const rows = await db
        .select({
          demandeAvisId: pcaetDemandeAvisTable.id,
          demarcheId: demarcheTable.id,
          demarcheTitre: demarcheTable.titre,
          demarcheStatus: demarcheTable.status,
          avisDeadlineAt: demarcheTable.avisDeadlineAt,
          transmittedAt: demarcheTable.transmittedAt,
          collectiviteId: collectiviteTable.id,
          collectiviteNom: collectiviteTable.nom,
          collectiviteDepartementCode: collectiviteTable.departementCode,
          nbAvisValides: sql<number>`(
            select count(*)::int from ${pcaetAvisTable}
            where ${pcaetAvisTable.demandeAvisId} = ${pcaetDemandeAvisTable.id}
              and ${pcaetAvisTable.valideLe} is not null
          )`,
          nbAvisBrouillons: sql<number>`(
            select count(*)::int from ${pcaetAvisTable}
            where ${pcaetAvisTable.demandeAvisId} = ${pcaetDemandeAvisTable.id}
              and ${pcaetAvisTable.valideLe} is null
          )`,
          dernierAvisValideLe: sql<string | null>`(
            select max(${pcaetAvisTable.valideLe}) from ${pcaetAvisTable}
            where ${pcaetAvisTable.demandeAvisId} = ${pcaetDemandeAvisTable.id}
          )`,
        })
        .from(pcaetDemandeAvisTable)
        .innerJoin(
          demarcheTable,
          eq(demarcheTable.id, pcaetDemandeAvisTable.demarcheId)
        )
        .innerJoin(
          collectiviteTable,
          eq(collectiviteTable.id, demarcheTable.collectiviteId)
        )
        .where(
          and(
            eq(
              pcaetDemandeAvisTable.instructeurCollectiviteId,
              instructeurCollectiviteId
            ),
            filtrePerimetre
          )
        );

      return success({ instructeurType: instructrice.type, rows });
    } catch (error) {
      this.logger.error(
        `Error listing demandes avis for collectivite ${instructeurCollectiviteId}: ${error}`
      );
      return failure(ListDemandesAvisErrorEnum.LIST_DEMANDES_AVIS_ERROR);
    }
  }

  async listContactsParCollectivite(
    collectiviteIds: number[],
    tx?: Transaction
  ): Promise<Map<number, DemandeAvisContact[]>> {
    if (collectiviteIds.length === 0) {
      return new Map();
    }

    const db = tx ?? this.databaseService.db;

    const rows = await db
      .select({
        collectiviteId: utilisateurCollectiviteAccessTable.collectiviteId,
        prenom: dcpTable.prenom,
        nom: dcpTable.nom,
        email: dcpTable.email,
      })
      .from(utilisateurCollectiviteAccessTable)
      .innerJoin(
        dcpTable,
        eq(dcpTable.id, utilisateurCollectiviteAccessTable.userId)
      )
      .where(
        and(
          inArray(
            utilisateurCollectiviteAccessTable.collectiviteId,
            collectiviteIds
          ),
          eq(utilisateurCollectiviteAccessTable.isActive, true),
          eq(utilisateurCollectiviteAccessTable.role, CollectiviteRole.ADMIN),
          eq(dcpTable.deleted, false)
        )
      );

    const parCollectivite = new Map<number, DemandeAvisContact[]>();
    for (const { collectiviteId, ...contact } of rows) {
      const contacts = parCollectivite.get(collectiviteId) ?? [];
      contacts.push(contact);
      parCollectivite.set(collectiviteId, contacts);
    }
    return parCollectivite;
  }
}
