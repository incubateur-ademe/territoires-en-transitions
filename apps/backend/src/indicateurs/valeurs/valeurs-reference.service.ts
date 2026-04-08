import { Injectable, Logger } from '@nestjs/common';
import CollectivitesService from '@tet/backend/collectivites/services/collectivites.service';
import { GetValeursReferenceRequest } from '@tet/backend/indicateurs/valeurs/get-valeurs-reference.request';
import {
  CollectiviteAvecType,
  PersonnalisationReponsesPayload,
} from '@tet/domain/collectivites';
import { IndicateurDefinition } from '@tet/domain/indicateurs';
import { inArray } from 'drizzle-orm';
import { groupBy, isNil } from 'es-toolkit';
import PersonnalisationsExpressionService from '../../collectivites/personnalisations/services/personnalisations-expression.service';
import PersonnalisationsService from '../../collectivites/personnalisations/services/personnalisations-service';
import { DatabaseService } from '../../utils/database/database.service';
import { ListPlatformDefinitionsRepository } from '../definitions/list-platform-definitions/list-platform-definitions.repository';
import { indicateurObjectifTable } from '../shared/models/indicateur-objectif.table';
import { ValeursReferenceDTO } from './valeurs-reference.dto';

@Injectable()
export default class ValeursReferenceService {
  private readonly logger = new Logger(ValeursReferenceService.name);

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly collectivitesService: CollectivitesService,
    private readonly listPlatformDefinitionsRepository: ListPlatformDefinitionsRepository,
    private readonly personnalisationsService: PersonnalisationsService,
    private readonly personnalisationsExpressionService: PersonnalisationsExpressionService
  ) {}

  private async getValeurObjectifsIndicateurs(indicateurIds: number[]) {
    return this.databaseService.db
      .select()
      .from(indicateurObjectifTable)
      .where(inArray(indicateurObjectifTable.indicateurId, indicateurIds));
  }

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
    const valeurObjectifsIndicateurs = await this.getValeurObjectifsIndicateurs(
      indicateurIds
    );
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
      await this.listPlatformDefinitionsRepository.listPlatformDefinitions({
        indicateurIds,
      });

    return definitions.map((definition) =>
      this.getValeursReferenceIndicateur(
        definition,
        valeursOBjectifsParIndicateurId[definition.id],
        collectiviteInfo,
        reponses
      )
    );
  }

  async getValeursReferenceForDefinition(options: {
    collectiviteId: number;
    definition: Pick<
      IndicateurDefinition,
      | 'id'
      | 'identifiantReferentiel'
      | 'exprCible'
      | 'exprSeuil'
      | 'libelleCibleSeuil'
      | 'unite'
    >;
    collectiviteAvecType?: CollectiviteAvecType;
    personnalisationReponses?: PersonnalisationReponsesPayload;
  }) {
    const {
      collectiviteId,
      definition,
      collectiviteAvecType,
      personnalisationReponses,
    } = options;
    this.logger.log(
      `Récupération des valeurs référence de l'indicateur ${definition.id}`
    );

    // charge les objectifs associés à l'indicateur
    const valeurObjectifsIndicateur = await this.getValeurObjectifsIndicateurs([
      definition.id,
    ]);

    // l'identité et la personnalisation de la collectivité
    const collectiviteInfo =
      collectiviteAvecType ||
      (await this.collectivitesService.getCollectiviteAvecType(collectiviteId));
    const reponses =
      personnalisationReponses ||
      (await this.personnalisationsService.getPersonnalisationReponses(
        collectiviteId
      ));

    return this.getValeursReferenceIndicateur(
      definition,
      valeurObjectifsIndicateur,
      collectiviteInfo,
      reponses
    );
  }

  private getValeursReferenceIndicateur(
    definition: Pick<
      IndicateurDefinition,
      | 'id'
      | 'identifiantReferentiel'
      | 'exprCible'
      | 'exprSeuil'
      | 'libelleCibleSeuil'
      | 'unite'
    >,
    valeurObjectifs:
      | {
          indicateurId: number;
          dateValeur: string;
          formule: string;
        }[]
      | undefined,
    collectiviteInfo: CollectiviteAvecType,
    reponses: PersonnalisationReponsesPayload
  ): ValeursReferenceDTO | null {
    const {
      id: indicateurId,
      identifiantReferentiel,
      exprCible,
      exprSeuil,
      libelleCibleSeuil,
      unite,
    } = definition;
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
      unite,
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
