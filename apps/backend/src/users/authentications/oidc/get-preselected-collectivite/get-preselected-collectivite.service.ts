import { Injectable, Logger } from '@nestjs/common';
import { collectiviteTable } from '@tet/backend/collectivites/shared/models/collectivite.table';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { and, desc, eq, isNotNull } from 'drizzle-orm';
import { utilisateurIdentiteOidcTable } from '../models/utilisateur-identite-oidc.table';

export type PreselectedCollectivite = {
  collectiviteId: number;
  nom: string;
  /** SIRET ProConnect à l'origine de la correspondance (pour l'affichage/debug). */
  siret: string;
};

/**
 * Pré-sélection de la collectivité à la première inscription via OIDC
 * (cas 3-Non) : à partir du `siret` de l'organisation que l'agent a
 * sélectionnée chez ProConnect, on propose automatiquement la collectivité
 * correspondante sur l'écran « rejoindre une collectivité ».
 *
 * ProConnect ne renvoie qu'UNE organisation (celle choisie à la connexion),
 * pas la liste des rattachements — on ne pré-sélectionne donc que celle-là,
 * modifiable par l'utilisateur.
 */
@Injectable()
export class GetPreselectedCollectiviteService {
  private readonly logger = new Logger(GetPreselectedCollectiviteService.name);

  constructor(private readonly databaseService: DatabaseService) {}

  async preselectionner(
    userId: string
  ): Promise<PreselectedCollectivite | null> {
    const db = this.databaseService.db;

    // Identité OIDC la plus récente disposant d'un siret (multi-provider : on
    // prend la dernière connexion, quel que soit le provider).
    const [identite] = await db
      .select({ siret: utilisateurIdentiteOidcTable.siret })
      .from(utilisateurIdentiteOidcTable)
      .where(
        and(
          eq(utilisateurIdentiteOidcTable.userId, userId),
          isNotNull(utilisateurIdentiteOidcTable.siret)
        )
      )
      .orderBy(desc(utilisateurIdentiteOidcTable.lastSignInAt))
      .limit(1);

    if (!identite?.siret) {
      this.logger.log(
        `Pré-sélection collectivité (compte ${userId}) : aucune identité OIDC avec un siret — pas de pré-sélection`
      );
      return null;
    }

    // SIRET (14) = SIREN (9) + NIC (5). La table collectivite stocke le SIREN ;
    // on rapproche au niveau SIREN (une collectivité = un SIREN).
    const siren = identite.siret.slice(0, 9);

    const collectivites = await db
      .select({ id: collectiviteTable.id, nom: collectiviteTable.nom })
      .from(collectiviteTable)
      .where(eq(collectiviteTable.siren, siren))
      .limit(2);

    this.logger.log(
      `Pré-sélection collectivité (compte ${userId}) : siret=${identite.siret} → siren=${siren} → ${collectivites.length} collectivité(s) trouvée(s)` +
        (collectivites.length > 0
          ? ` [${collectivites.map((c) => `#${c.id} ${c.nom}`).join(', ')}]`
          : '')
    );

    // Correspondance unique requise : 0 → pas de collectivité connue pour ce
    // SIREN ; >1 → ambiguïté (ne devrait pas arriver, SIREN unique) — dans les
    // deux cas on ne pré-sélectionne rien (sélecteur vide, comportement actuel).
    if (collectivites.length !== 1) {
      this.logger.log(
        `Pas de pré-sélection pour le SIREN ${siren} (compte ${userId}) : ${collectivites.length} collectivité(s) trouvée(s)`
      );
      return null;
    }

    this.logger.log(
      `Pré-sélection retenue pour le compte ${userId} : collectivité #${collectivites[0].id} (${collectivites[0].nom}), siren ${siren}`
    );

    return {
      collectiviteId: collectivites[0].id,
      nom: collectivites[0].nom,
      siret: identite.siret,
    };
  }
}
