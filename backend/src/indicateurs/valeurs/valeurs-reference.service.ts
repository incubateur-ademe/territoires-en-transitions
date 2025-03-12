import { PermissionService } from '@/backend/auth/authorizations/permission.service';
import CollectivitesService from '@/backend/collectivites/services/collectivites.service';
import { Injectable, Logger } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import {
  AuthUser,
  PermissionOperation,
  ResourceType,
} from '../../auth/index-domain';
import ExpressionParserService from '../../personnalisations/services/expression-parser.service';
import PersonnalisationsService from '../../personnalisations/services/personnalisations-service';
import { DatabaseService } from '../../utils/database/database.service';
import ListDefinitionsService from '../definitions/list-definitions.service';
import { indicateurObjectifTable } from '../shared/models/indicateur-objectif.table';
import { GetMoyenneCollectivitesRequest } from './get-moyenne-collectivites.request';

@Injectable()
export default class ValeursReferenceService {
  private readonly logger = new Logger(ValeursReferenceService.name);

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly permissionService: PermissionService,
    private readonly collectivitesService: CollectivitesService,
    private readonly listDefinitionsService: ListDefinitionsService,
    private readonly personnalisationsService: PersonnalisationsService,
    private readonly expressionParserService: ExpressionParserService
  ) {}

  /**
   * Donne les valeurs de référence (cible et/ou seuil) d'un indicateur pour une collectivité
   */
  async getValeursReference(
    options: GetMoyenneCollectivitesRequest,
    tokenInfo: AuthUser
  ) {
    const { collectiviteId, indicateurId } = options;

    // Vérifie les droits
    await this.permissionService.isAllowed(
      tokenInfo,
      PermissionOperation.INDICATEURS_VISITE,
      ResourceType.COLLECTIVITE,
      collectiviteId
    );

    this.logger.log(
      `Récupération des valeurs référence d'un indicateur selon ces options : ${JSON.stringify(
        options
      )}`
    );

    const definition =
      await this.listDefinitionsService.getIndicateurDefinitions([
        indicateurId,
      ]);
    const { exprCible, exprSeuil, libelleCibleSeuil } = definition?.[0] || {};

    // charge aussi les objectifs associés à l'indicateur
    const valeurObjectifs = await this.databaseService.db
      .select()
      .from(indicateurObjectifTable)
      .where(eq(indicateurObjectifTable.indicateurId, indicateurId));

    if (!exprCible && !exprSeuil && !valeurObjectifs.length) {
      return null;
    }

    const collectiviteInfo =
      await this.collectivitesService.getCollectiviteAvecType(collectiviteId);
    const reponses =
      await this.personnalisationsService.getPersonnalisationReponses(
        collectiviteId
      );

    let cible = null;
    let seuil = null;
    let objectifs = null;

    if (exprCible) {
      cible = this.expressionParserService.parseAndEvaluateExpression(
        exprCible,
        reponses,
        collectiviteInfo
      );
    }
    if (exprSeuil) {
      seuil = this.expressionParserService.parseAndEvaluateExpression(
        exprSeuil,
        reponses,
        collectiviteInfo
      );
    }
    if (valeurObjectifs.length) {
      objectifs = valeurObjectifs
        .map(({ formule, ...other }) => {
          const valeur =
            this.expressionParserService.parseAndEvaluateExpression(
              formule,
              reponses,
              collectiviteInfo
            );
          return typeof valeur === 'number'
            ? {
                valeur,
                ...other,
              }
            : null;
        })
        .filter((row) => row !== null);
    }

    return {
      libelle: libelleCibleSeuil,
      cible: typeof cible === 'number' ? cible : null,
      seuil: typeof seuil === 'number' ? seuil : null,
      objectifs: objectifs?.length ? objectifs : null,
      // info nécessaire pour savoir si la question de personnalisation de
      // l'indicateur cae_25.b doit être affichée
      drom: collectiviteInfo?.drom
    };
  }
}
