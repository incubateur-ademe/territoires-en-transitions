import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { and, desc, eq, isNotNull } from 'drizzle-orm';
import { GetCollectiviteBySiretService } from '../get-collectivite-by-siret/get-collectivite-by-siret.service';
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

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly getCollectiviteBySiretService: GetCollectiviteBySiretService
  ) {}

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

    // Le rapprochement lui-même est partagé avec le rattachement automatique :
    // les deux chemins doivent désigner la même collectivité pour un même
    // SIRET, sans quoi l'écran de choix proposerait autre chose que ce que
    // l'identité vaut.
    const rapprochee = await this.getCollectiviteBySiretService.getBySiret(
      identite.siret
    );

    if (!rapprochee) {
      this.logger.log(
        `Pas de pré-sélection pour le compte ${userId} : le SIRET ${identite.siret} ne désigne aucune collectivité`
      );
      return null;
    }

    this.logger.log(
      `Pré-sélection retenue pour le compte ${userId} : collectivité #${rapprochee.collectiviteId} (${rapprochee.nom}), siret ${identite.siret}`
    );

    return {
      collectiviteId: rapprochee.collectiviteId,
      nom: rapprochee.nom,
      siret: identite.siret,
    };
  }
}
