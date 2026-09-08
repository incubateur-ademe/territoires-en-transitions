import { Injectable, Logger } from '@nestjs/common';
import { collectiviteTable } from '@tet/backend/collectivites/shared/models/collectivite.table';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { CollectiviteType } from '@tet/domain/collectivites';
import { and, eq } from 'drizzle-orm';

/** Un SIRET : le SIREN de l'entreprise (9) et le NIC de l'établissement (5). */
const SIRET_PATTERN = /^\d{14}$/;

export type CollectiviteRapprochee = {
  collectiviteId: number;
  nom: string;
  type: CollectiviteType;
  siren: string | null;
  /** Le SIRET d'où vient le rapprochement. */
  siret: string;
};

/**
 * La collectivité que désigne un SIRET, au plus précis disponible : sur le SIRET
 * entier — seul niveau qui départage les directions régionales de l'ADEME, qui
 * partagent son SIREN — puis sur le SIREN seul s'il est unique, le classeur ne
 * donnant que le NIC du siège.
 *
 * Dans le module OIDC et non dans le domaine collectivités : ses deux appelants
 * y sont, et `CollectivitesCoreModule` importe `UsersModule`.
 */
@Injectable()
export class GetCollectiviteBySiretService {
  private readonly logger = new Logger(GetCollectiviteBySiretService.name);

  constructor(private readonly databaseService: DatabaseService) {}

  async getBySiret(
    siret: string,
    tx?: Transaction
  ): Promise<CollectiviteRapprochee | null> {
    const db = tx ?? this.databaseService.db;

    if (!SIRET_PATTERN.test(siret)) {
      this.logger.log(
        `Rapprochement par SIRET : « ${siret} » n'est pas un SIRET, aucun rapprochement`
      );
      return null;
    }

    const siren = siret.slice(0, 9);
    const nic = siret.slice(9);

    const colonnes = {
      collectiviteId: collectiviteTable.id,
      nom: collectiviteTable.nom,
      type: collectiviteTable.type,
      siren: collectiviteTable.siren,
    };

    const parSiret = await db
      .select(colonnes)
      .from(collectiviteTable)
      .where(
        and(eq(collectiviteTable.siren, siren), eq(collectiviteTable.nic, nic))
      )
      .limit(2);

    if (parSiret.length === 1) {
      return { ...parSiret[0], siret };
    }

    if (parSiret.length > 1) {
      // L'import n'en pose qu'une par SIRET : deux signent une saisie à la
      // main, et on ne devine pas laquelle.
      this.logger.warn(
        `Rapprochement par SIRET ${siret} : plusieurs collectivités portent ce SIRET, aucun rapprochement`
      );
      return null;
    }

    const parSiren = await db
      .select(colonnes)
      .from(collectiviteTable)
      .where(eq(collectiviteTable.siren, siren))
      .limit(2);

    if (parSiren.length !== 1) {
      this.logger.log(
        `Rapprochement par SIRET ${siret} : aucune collectivité sur ce SIRET, et ${parSiren.length} sur le SIREN ${siren} — aucun rapprochement`
      );
      return null;
    }

    return { ...parSiren[0], siret };
  }
}
