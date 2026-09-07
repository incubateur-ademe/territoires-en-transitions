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
 * La collectivité que désigne un SIRET, au plus précis dont on dispose.
 *
 * Le SIRET nomme un **établissement**, `collectivite` porte un SIREN et un NIC :
 * les deux se rapprochent donc à deux niveaux, et l'ordre compte.
 *
 * 1. Sur le SIRET entier. C'est le seul niveau qui tranche entre les directions
 *    régionales de l'ADEME, qui partagent son SIREN et ne se distinguent que par
 *    leur NIC.
 * 2. À défaut, sur le SIREN seul, et seulement s'il ne désigne qu'une
 *    collectivité. Le classeur de l'ADEME donne le NIC du **siège** ; un agent
 *    dont ProConnect renvoie une autre implantation de la même DREAL doit
 *    quand même retrouver son service.
 *
 * Ce service vit dans le module OIDC et non dans le domaine collectivités : ses
 * deux appelants y sont, et `CollectivitesCoreModule` importe `UsersModule` —
 * l'y placer refermerait le cycle.
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

    // Deux lignes suffisent à conclure : ce qu'on cherche, c'est l'unicité.
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
      // L'import ne pose qu'une ligne par SIRET, et le `verify` de
      // `collectivite/perimetre_secondaire` le tient. Y arriver quand même
      // signifie une saisie à la main : on ne devine pas laquelle.
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
