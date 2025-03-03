import { PermissionService } from '@/backend/auth/authorizations/permission.service';
import CollectivitesService from '@/backend/collectivites/services/collectivites.service';
import { Injectable, Logger } from '@nestjs/common';
import { aliasedTable, and, asc, eq, isNotNull, ne, sql } from 'drizzle-orm';
import {
  AuthUser,
  PermissionOperation,
  ResourceType,
} from '../../auth/index-domain';
import { collectiviteCardView } from '../../collectivites/shared/models/collectivite-card.view';
import { DatabaseService } from '../../utils/database/database.service';
import { indicateurSourceMetadonneeTable } from '../index-domain';
import { indicateurValeurTable } from '../shared/models/indicateur-valeur.table';
import { GetAverageValuesRequest } from './get-average-values.request';

@Injectable()
export default class ValeursCalculeesService {
  private readonly logger = new Logger(ValeursCalculeesService.name);

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly permissionService: PermissionService,
    private readonly collectiviteService: CollectivitesService
  ) {}

  // TODO: à changer pour ne plus utiliser la vue `collectivite_card`
  async getTypeCollectivite(collectiviteId: number) {
    this.logger.log(
      `Récupération du type de la collectivité ${collectiviteId}`
    );

    const result = await this.databaseService.db
      .select({
        typeCollectivite: collectiviteCardView.typeCollectivite,
      })
      .from(collectiviteCardView)
      .where(eq(collectiviteCardView.collectiviteId, collectiviteId));

    return result?.[0]?.typeCollectivite || null;
  }

  /**
   * Donne la moyenne par date d'un indicateur pour les collectivités de même type
   */
  async getAverageValues(
    options: GetAverageValuesRequest,
    tokenInfo: AuthUser
  ) {
    const { collectiviteId, indicateurId } = options;

    // Vérifie les droits
    const collectivitePrivate = await this.collectiviteService.isPrivate(
      collectiviteId
    );
    await this.permissionService.isAllowed(
      tokenInfo,
      collectivitePrivate
        ? PermissionOperation.INDICATEURS_LECTURE
        : PermissionOperation.INDICATEURS_VISITE,
      ResourceType.COLLECTIVITE,
      collectiviteId
    );

    this.logger.log(
      `Récupération des valeurs moyenne d'un indicateur selon ces options : ${JSON.stringify(
        options
      )}`
    );

    const iv = aliasedTable(indicateurValeurTable, 'iv');
    const ism = aliasedTable(indicateurSourceMetadonneeTable, 'ism');

    // TODO: à changer pour ne plus utiliser la vue `collectivite_card`
    const typeCollectivite = await this.getTypeCollectivite(collectiviteId);
    if (!typeCollectivite) {
      return null;
    }
    const cc = aliasedTable(collectiviteCardView, 'cc');

    const valeurs = await this.databaseService.db
      .select({
        dateValeur: iv.dateValeur,
        valeur: sql`avg(${iv.resultat})`.mapWith(Number),
      })
      .from(iv)
      .leftJoin(cc, eq(cc.collectiviteId, iv.collectiviteId))
      .leftJoin(ism, eq(iv.metadonneeId, ism.id))
      .where(
        and(
          eq(cc.typeCollectivite, typeCollectivite),
          isNotNull(iv.resultat),
          isNotNull(iv.metadonneeId),
          ne(ism.sourceId, 'snbc'),
          eq(iv.indicateurId, indicateurId)
        )
      )
      .groupBy(iv.dateValeur)
      .orderBy(asc(iv.dateValeur));

    this.logger.log(
      `Récupération de ${valeurs.length} valeurs moyenne d'indicateur`
    );

    return { typeCollectivite, valeurs };
  }
}
