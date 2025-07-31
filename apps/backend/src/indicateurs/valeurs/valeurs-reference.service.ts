import { CollectiviteAvecType } from '@/backend/collectivites/identite-collectivite.dto';
import CollectivitesService from '@/backend/collectivites/services/collectivites.service';
import { IndicateurDefinition } from '@/backend/indicateurs/shared/models/indicateur-definition.table';
import { GetValeursReferenceRequest } from '@/backend/indicateurs/valeurs/get-valeurs-reference.request';
import { PersonnalisationReponsesPayload } from '@/backend/personnalisations/models/get-personnalisation-reponses.response';
import { Injectable, Logger } from '@nestjs/common';
import { inArray } from 'drizzle-orm';
import { groupBy, isNil } from 'es-toolkit';
import PersonnalisationsExpressionService from '../../personnalisations/services/personnalisations-expression.service';
import PersonnalisationsService from '../../personnalisations/services/personnalisations-service';
import { DatabaseService } from '../../utils/database/database.service';
import { ListDefinitionsService } from '../list-definitions/list-definitions.service';
import { indicateurObjectifTable } from '../shared/models/indicateur-objectif.table';

@Injectable()
export default class ValeursReferenceService {
  private readonly logger = new Logger(ValeursReferenceService.name);

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly collectivitesService: CollectivitesService,
    private readonly listDefinitionsService: ListDefinitionsService,
    private readonly personnalisationsService: PersonnalisationsService,
    private readonly personnalisationsExpressionService: PersonnalisationsExpressionService
  ) {}

  /**
   * Donne les valeurs de référence (cible et/ou seuil) des indicateurs pour une collectivité
   */
  async getValeursReference(
    options: GetValeursReferenceRequest & {
      collectiviteAvecType?: CollectiviteAvecType;
      personnalisationReponses?: PersonnalisationReponsesPayload;
    }
  ) {
    const {
      collectiviteId,
      indicateurIds,
      collectiviteAvecType,
      personnalisationReponses,
    } = options;
    this.logger.log(
      `Récupération des valeurs référence d'un indicateur selon ces options : ${JSON.stringify(
        options
      )}`
    );

    // charge les objectifs associés aux indicateurs
    const valeurObjectifsIndicateurs = await this.databaseService.db
      .select()
      .from(indicateurObjectifTable)
      .where(inArray(indicateurObjectifTable.indicateurId, indicateurIds));
    const valeursOBjectifsParIndicateurId = groupBy(
      valeurObjectifsIndicateurs,
      ({ indicateurId }) => indicateurId
    );

    // l'identité et la personnalisation de la collectivité
    const collectiviteInfo =
      collectiviteAvecType ||
      (await this.collectivitesService.getCollectiviteAvecType(collectiviteId));
    const reponses =
      personnalisationReponses ||
      (await this.personnalisationsService.getPersonnalisationReponses(
        collectiviteId
      ));

    // les définitions des indicateurs
    const definitions =
      await this.listDefinitionsService.getIndicateurDefinitions(indicateurIds);

    return definitions.map((definition) =>
      this.getValeursReferenceIndicateur(
        definition,
        valeursOBjectifsParIndicateurId,
        collectiviteInfo,
        reponses
      )
    );
  }

  private getValeursReferenceIndicateur(
    definition: IndicateurDefinition,
    valeursOBjectifsParIndicateurId: Record<
      number,
      {
        indicateurId: number;
        dateValeur: string;
        formule: string;
      }[]
    >,
    collectiviteInfo: CollectiviteAvecType,
    reponses: PersonnalisationReponsesPayload
  ) {
    const {
      id: indicateurId,
      identifiantReferentiel,
      exprCible,
      exprSeuil,
      libelleCibleSeuil,
    } = definition;
    const valeurObjectifs = valeursOBjectifsParIndicateurId[indicateurId];
    if (exprCible === null && exprSeuil === null && !valeurObjectifs?.length) {
      return null;
    }

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
      indicateurId,
      identifiantReferentiel,
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
