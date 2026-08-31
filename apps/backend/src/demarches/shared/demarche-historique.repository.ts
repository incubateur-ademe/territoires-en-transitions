import { Injectable } from '@nestjs/common';
import { demarcheTable } from '@tet/backend/demarches/shared/models/demarche.table';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import type { DemarcheType } from '@tet/domain/demarches';
import { DEMARCHE_PCAET_ABOUTIES_STATUSES } from '@tet/domain/demarches';
import { and, eq, inArray, ne } from 'drizzle-orm';

/**
 * Ce que la plateforme sait des dépôts passés d'une collectivité.
 *
 * Limite connue : elle ne connaît que les démarches menées chez elle. Un PCAET
 * antérieur au produit, ou déposé hors plateforme, lui est invisible — la
 * détection du renouvellement restera partielle jusqu'à l'import des PCAET
 * déposés.
 */
@Injectable()
export class DemarcheHistoriqueRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  /**
   * La collectivité a-t-elle déjà mené un dépôt à son terme, **hors la démarche
   * courante** ? Sans cette exclusion, ouvrir le dossier d'un PCAET publié le
   * ferait passer pour le renouvellement de lui-même.
   */
  async aDejaAbouti(
    {
      collectiviteId,
      demarcheType,
      demarcheId,
    }: {
      collectiviteId: number;
      demarcheType: DemarcheType;
      /** La démarche consultée, exclue du décompte. */
      demarcheId: number;
    },
    tx?: Transaction
  ): Promise<boolean> {
    const db = tx ?? this.databaseService.db;

    const rows = await db
      .select({ id: demarcheTable.id })
      .from(demarcheTable)
      .where(
        and(
          eq(demarcheTable.collectiviteId, collectiviteId),
          eq(demarcheTable.type, demarcheType),
          ne(demarcheTable.id, demarcheId),
          inArray(demarcheTable.status, [...DEMARCHE_PCAET_ABOUTIES_STATUSES])
        )
      )
      .limit(1);

    return rows.length > 0;
  }
}
