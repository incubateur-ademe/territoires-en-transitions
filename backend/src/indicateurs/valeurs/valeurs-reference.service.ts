import { PermissionService } from '@/backend/auth/authorizations/permission.service';
import CollectivitesService from '@/backend/collectivites/services/collectivites.service';
import { Injectable, Logger } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { isNil } from 'es-toolkit';
import {
  AuthUser,
  PermissionOperationEnum,
  ResourceType,
} from '../../auth/index-domain';
import PersonnalisationsExpressionService from '../../personnalisations/services/personnalisations-expression.service';
import PersonnalisationsService from '../../personnalisations/services/personnalisations-service';
import { DatabaseService } from '../../utils/database/database.service';
import { ListDefinitionsService } from '../list-definitions/list-definitions.service';
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
    private readonly personnalisationsExpressionService: PersonnalisationsExpressionService
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
      PermissionOperationEnum['INDICATEURS.VISITE'],
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

    if (exprCible === null && exprSeuil === null && !valeurObjectifs.length) {
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

    if (!isNil(exprCible)) {
      this.logger.log(`Parsing de l'expression cible : ${exprCible}`);
      cible =
        this.personnalisationsExpressionService.parseAndEvaluateExpression(
          exprCible,
          reponses,
          collectiviteInfo
        );
    }
    if (!isNil(exprSeuil)) {
      this.logger.log(`Parsing de l'expression de seuil : ${exprSeuil}`);
      seuil =
        this.personnalisationsExpressionService.parseAndEvaluateExpression(
          exprSeuil,
          reponses,
          collectiviteInfo
        );
    }
    if (valeurObjectifs?.length) {
      objectifs = valeurObjectifs
        .map(({ formule, ...other }) => {
          const valeur =
            this.personnalisationsExpressionService.parseAndEvaluateExpression(
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
      drom: collectiviteInfo?.drom,
    };
  }
}
