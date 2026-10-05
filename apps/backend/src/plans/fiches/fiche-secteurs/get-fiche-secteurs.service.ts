import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ServiceSecondArg } from '@tet/backend/utils/nest/service-second-arg.utils';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import {
  CommonError,
  CommonErrorEnum,
} from '@tet/backend/utils/trpc/common-errors';
import {
  FicheSecteurs,
  getSecteursRetenus,
  OrigineSecteursEnum,
} from '@tet/domain/plans';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { eq } from 'drizzle-orm';
import FicheActionPermissionsService from '../fiche-action-permissions.service';
import { ficheActionTable } from '../shared/models/fiche-action.table';
import { CommunsSecteursApiService } from './communs-secteurs-api.service';
import {
  FicheSecteursAttributionCreate,
  FicheSecteursAttributionRepository,
} from './fiche-secteurs-attribution.repository';
import { FicheSecteursEligibiliteRepository } from './fiche-secteurs-eligibilite.repository';
import {
  hasTitre,
  is404Definitif,
  toFicheSecteurs,
} from './fiche-secteurs.rules';
import { GetFicheSecteursInput } from './get-fiche-secteurs.input';
import { GetFicheSecteursOutput } from './get-fiche-secteurs.output';

const EN_COURS_DE_CALCUL: FicheSecteurs = { etat: 'en_cours_de_calcul' };
const NON_RENSEIGNE: FicheSecteurs = { etat: 'non_renseigne' };

/** N'écrit jamais dans la fiche elle-même : ni date de modification, ni webhook */
@Injectable()
export class GetFicheSecteursService {
  private readonly logger = new Logger(GetFicheSecteursService.name);

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly ficheActionPermissionsService: FicheActionPermissionsService,
    private readonly communsSecteursApiService: CommunsSecteursApiService,
    private readonly attributionRepository: FicheSecteursAttributionRepository,
    private readonly eligibiliteRepository: FicheSecteursEligibiliteRepository
  ) {}

  async getSecteurs(
    { ficheId }: GetFicheSecteursInput,
    { user }: ServiceSecondArg
  ): Promise<Result<GetFicheSecteursOutput, CommonError>> {
    try {
      await this.ficheActionPermissionsService.canReadFiche(ficheId, user);
    } catch (error) {
      if (error instanceof NotFoundException) {
        return failure(CommonErrorEnum.NOT_FOUND);
      }
      if (error instanceof ForbiddenException) {
        return failure(CommonErrorEnum.UNAUTHORIZED);
      }
      return failure(CommonErrorEnum.SERVER_ERROR, error as Error);
    }

    try {
      const attribution = await this.attributionRepository.findByFicheId(
        ficheId
      );
      // s'affiche même si la fiche n'est plus concernée (sortie d'un plan PCAET, saisie manuelle)
      if (attribution) {
        return success(toFicheSecteurs(attribution));
      }
      if (!(await this.eligibiliteRepository.isFicheConcernee(ficheId))) {
        return success(NON_RENSEIGNE);
      }
      const [fiche] = await this.databaseService.db
        .select({
          titre: ficheActionTable.titre,
          modifiedAt: ficheActionTable.modifiedAt,
        })
        .from(ficheActionTable)
        .where(eq(ficheActionTable.id, ficheId));
      // fiche créée vide : l'interroger figerait un résultat calculé sans titre
      if (!hasTitre(fiche.titre)) {
        return success(EN_COURS_DE_CALCUL);
      }
      return success(
        await this.fetchAndSaveSecteurs(ficheId, fiche.modifiedAt)
      );
    } catch (error) {
      this.logger.error(
        `Erreur à la lecture des secteurs de la fiche ${ficheId}`,
        error
      );
      return failure(CommonErrorEnum.DATABASE_ERROR, error as Error);
    }
  }

  private async fetchAndSaveSecteurs(
    ficheId: number,
    ficheModifiedAt: string
  ): Promise<FicheSecteurs> {
    const lookup = await this.communsSecteursApiService.getSecteurs(ficheId);
    if (!lookup.success) {
      this.logger.warn(
        `Secteurs de la fiche ${ficheId} non récupérés : ${lookup.error}`
      );
      return EN_COURS_DE_CALCUL;
    }

    let attribution: FicheSecteursAttributionCreate;
    if (lookup.data.statut === 'inconnue') {
      if (!is404Definitif(ficheModifiedAt)) {
        return EN_COURS_DE_CALCUL;
      }
      attribution = {
        ficheId,
        secteurs: [],
        origine: OrigineSecteursEnum.INDISPONIBLE,
      };
    } else {
      const secteurs =
        getSecteursRetenus(lookup.data.reponse) ??
        ((await this.isClasseeParCommuns(ficheId)) ? [] : null);
      if (secteurs === null) {
        return EN_COURS_DE_CALCUL;
      }
      attribution = {
        ficheId,
        secteurs,
        origine: OrigineSecteursEnum.AUTOMATIQUE,
        methode: lookup.data.reponse.methode,
        reponseCommuns: lookup.data.reponseBrute,
      };
    }

    const saved = await this.attributionRepository.createIfAbsent(attribution);
    return saved ? toFicheSecteurs(saved) : EN_COURS_DE_CALCUL;
  }

  private async isClasseeParCommuns(ficheId: number): Promise<boolean> {
    const action = await this.communsSecteursApiService.getAction(ficheId);
    if (!action.success) {
      this.logger.warn(
        `Classification de la fiche ${ficheId} non récupérée : ${action.error}`
      );
      return false;
    }
    return action.data.classee;
  }
}
