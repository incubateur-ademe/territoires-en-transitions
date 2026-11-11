import { Injectable, Logger } from '@nestjs/common';
import { ListIndicateursPredefinisRepository } from '@tet/backend/indicateurs/indicateurs/list-indicateurs-predefinis/list-indicateurs-predefinis.repository';
import ManageIndicateurValeursService from '@tet/backend/indicateurs/valeurs/manage-indicateur-valeurs/manage-indicateur-valeurs.service';
import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import { ServiceSecondArg } from '@tet/backend/utils/nest/service-second-arg.utils';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import { getCodeCommuneOfArrondissement } from '@tet/domain/collectivites';
import {
  getStatutTrajectoireSnbc3,
  IndicateurSourceEnum,
  StatutTrajectoireSnbc3,
} from '@tet/domain/indicateurs';
import { ResourceType } from '@tet/domain/users';
import { partition, uniq } from 'es-toolkit';
import { Readable } from 'node:stream';
import { Snbc3ReleaseStorageService } from '../import-snbc3/snbc3-release-storage.service';
import { TrajectoireSnbc3FeatureFlagService } from '../trajectoire-snbc3-feature-flag.service';
import TrajectoiresDataService from '../trajectoires-data.service';
import {
  TrajectoireSnbc3Error,
  TrajectoireSnbc3ErrorEnum,
} from './trajectoire-snbc3.errors';
import {
  CheckStatusTrajectoireSnbc3Output,
  GetTrajectoireSnbc3Output,
} from './trajectoire-snbc3.output';
import {
  Snbc3Collectivite,
  Snbc3Millesime,
  TrajectoireSnbc3Repository,
} from './trajectoire-snbc3.repository';

/**
 * Lecture de la trajectoire SNBC 3 importée, réservée aux utilisateurs qui
 * ont le flag `is-trajectoire-snbc3-enabled` (lot 2 du plan SNBC 3). Rien n'y
 * est calculé : la trajectoire vient de l'import (ADR 0023).
 */
@Injectable()
export class TrajectoireSnbc3Service {
  private readonly logger = new Logger(TrajectoireSnbc3Service.name);

  constructor(
    private readonly repository: TrajectoireSnbc3Repository,
    private readonly featureFlag: TrajectoireSnbc3FeatureFlagService,
    private readonly permissionService: PermissionService,
    private readonly valeursService: ManageIndicateurValeursService,
    private readonly listIndicateursPredefinisRepository: ListIndicateursPredefinisRepository,
    private readonly trajectoiresDataService: TrajectoiresDataService,
    private readonly releaseStorage: Snbc3ReleaseStorageService
  ) {}

  /**
   * PDF de méthodologie de la release importée : le même millésime que les
   * valeurs affichées. Réservé aux utilisateurs qui ont le flag ; le document
   * est public, la collectivité ne sert qu'à évaluer le flag.
   */
  async getMethodologie(
    { collectiviteId }: { collectiviteId: number },
    { user }: ServiceSecondArg
  ): Promise<
    Result<{ stream: Readable; fileName: string }, TrajectoireSnbc3Error>
  > {
    if (
      !(await this.featureFlag.isTrajectoireSnbc3Enabled(user, collectiviteId))
    ) {
      return failure(TrajectoireSnbc3ErrorEnum.TRAJECTOIRE_SNBC3_NON_OUVERTE);
    }
    const methodologie = await this.releaseStorage.getMethodologie();
    if (!methodologie.success) {
      return failure(TrajectoireSnbc3ErrorEnum.SERVER_ERROR);
    }
    if (!methodologie.data) {
      return failure(TrajectoireSnbc3ErrorEnum.METHODOLOGIE_SNBC3_INDISPONIBLE);
    }
    return success(methodologie.data);
  }

  async checkStatus(
    { collectiviteId }: { collectiviteId: number },
    { user }: ServiceSecondArg
  ): Promise<Result<CheckStatusTrajectoireSnbc3Output, TrajectoireSnbc3Error>> {
    const resolved = await this.resolveStatut({ collectiviteId }, { user });
    if (!resolved.success) {
      return resolved;
    }
    const { status, collectivite, millesime } = resolved.data;

    const collectiviteRattachement =
      status === StatutTrajectoireSnbc3.COMMUNE_NON_SUPPORTEE
        ? await this.findCollectiviteRattachement(collectivite, millesime)
        : null;

    return success({
      status,
      millesime: this.toMillesimeOutput(millesime),
      ...(collectiviteRattachement ? { collectiviteRattachement } : {}),
    });
  }

  /**
   * Flag, collectivité, droits de lecture et présence dans le millésime :
   * partagé par `checkStatus` et l'export du classeur, qui suit les mêmes
   * règles que la page Trajectoire.
   */
  async resolveStatut(
    { collectiviteId }: { collectiviteId: number },
    { user }: ServiceSecondArg
  ): Promise<
    Result<
      {
        status: StatutTrajectoireSnbc3;
        collectivite: Snbc3Collectivite;
        millesime: Snbc3Millesime | null;
      },
      TrajectoireSnbc3Error
    >
  > {
    if (
      !(await this.featureFlag.isTrajectoireSnbc3Enabled(user, collectiviteId))
    ) {
      return failure(TrajectoireSnbc3ErrorEnum.TRAJECTOIRE_SNBC3_NON_OUVERTE);
    }

    const collectivite = await this.repository.getCollectivite(collectiviteId);
    if (!collectivite) {
      return failure(TrajectoireSnbc3ErrorEnum.COLLECTIVITE_NOT_FOUND);
    }

    const hasDroitsLecture = await this.canReadValeurs(user, collectiviteId);
    const millesime = await this.repository.getMillesime();
    const isInMillesime =
      hasDroitsLecture && millesime
        ? await this.repository.hasValeurs(
            collectiviteId,
            millesime.metadonneeId
          )
        : false;

    const status = getStatutTrajectoireSnbc3({
      hasDroitsLecture,
      isInMillesime,
      collectivite,
    });
    return success({ status, collectivite, millesime });
  }

  /**
   * Trajectoire à proposer à une commune hors du millésime : celle de son EPCI
   * à fiscalité propre. Un arrondissement municipal n'a pas de relation en
   * base (Banatic ne connaît que la commune entière) : on passe par sa
   * commune, qui a elle-même une trajectoire (Paris) ou un EPCI.
   */
  private async findCollectiviteRattachement(
    collectivite: Snbc3Collectivite,
    millesime: Snbc3Millesime | null
  ): Promise<{ id: number; nom: string } | null> {
    const codeCommune = getCodeCommuneOfArrondissement(
      collectivite.communeCode
    );
    if (!codeCommune) {
      return this.repository.findEpciParent(collectivite.id);
    }
    const commune = await this.repository.findCommuneByCode(codeCommune);
    if (!commune) {
      return null;
    }
    const isCommuneInMillesime = millesime
      ? await this.repository.hasValeurs(commune.id, millesime.metadonneeId)
      : false;
    return isCommuneInMillesime
      ? commune
      : this.repository.findEpciParent(commune.id);
  }

  async get(
    { collectiviteId }: { collectiviteId: number },
    { user }: ServiceSecondArg
  ): Promise<Result<GetTrajectoireSnbc3Output, TrajectoireSnbc3Error>> {
    if (
      !(await this.featureFlag.isTrajectoireSnbc3Enabled(user, collectiviteId))
    ) {
      return failure(TrajectoireSnbc3ErrorEnum.TRAJECTOIRE_SNBC3_NON_OUVERTE);
    }
    if (!(await this.canReadValeurs(user, collectiviteId))) {
      return failure(TrajectoireSnbc3ErrorEnum.UNAUTHORIZED);
    }

    const millesime = await this.repository.getMillesime();
    const empty: GetTrajectoireSnbc3Output = {
      millesime: this.toMillesimeOutput(millesime),
      trajectoire: {
        emissionsGes: [],
        consommationsFinales: [],
        sequestrations: [],
      },
    };
    if (!millesime) {
      return success(empty);
    }

    const valeurs = (
      await this.valeursService.getIndicateursValeurs({
        periodicite: 'annuelle',
        collectiviteId,
        sources: [IndicateurSourceEnum.SNBC3],
      })
    ).map((v) => v.indicateurValeur);
    if (!valeurs.length) {
      return success(empty);
    }

    const definitionsResult =
      await this.listIndicateursPredefinisRepository.listIndicateursPredefinis({
        indicateurIds: uniq(valeurs.map((v) => v.indicateurId)),
      });
    if (!definitionsResult.success) {
      this.logger.error(
        `Lecture des définitions de la trajectoire SNBC 3 de la collectivité ${collectiviteId} en échec`
      );
      return failure(TrajectoireSnbc3ErrorEnum.DATABASE_ERROR);
    }

    const {
      CONSOMMATIONS_IDENTIFIANTS_PREFIX,
      SEQUESTRATION_IDENTIFIANTS_PREFIX,
    } = this.trajectoiresDataService;
    const [consommations, emissionsEtSequestrations] = partition(
      definitionsResult.data,
      (d) =>
        !!d.identifiantReferentiel?.startsWith(
          CONSOMMATIONS_IDENTIFIANTS_PREFIX
        )
    );
    const [sequestrations, emissions] = partition(
      emissionsEtSequestrations,
      (d) =>
        !!d.identifiantReferentiel?.startsWith(
          SEQUESTRATION_IDENTIFIANTS_PREFIX
        )
    );

    // Séquestration et captage stockés en positif, renvoyés en négatif comme
    // `snbc.getOrCompute`.
    const group = (definitions: typeof definitionsResult.data) =>
      this.trajectoiresDataService.inverseSigneSequestrations(
        this.valeursService.groupeIndicateursValeursParIndicateur(
          valeurs,
          definitions,
          true
        )
      );

    return success({
      millesime: empty.millesime,
      trajectoire: {
        emissionsGes: group(emissions),
        consommationsFinales: group(consommations),
        sequestrations: group(sequestrations),
      },
    });
  }

  private async canReadValeurs(
    user: ServiceSecondArg['user'],
    collectiviteId: number
  ): Promise<boolean> {
    const permission = await this.permissionService.isAllowed(
      user,
      'indicateurs.valeurs.read',
      ResourceType.COLLECTIVITE,
      { collectiviteId }
    );
    return permission.success;
  }

  private toMillesimeOutput(millesime: Snbc3Millesime | null) {
    return millesime ? { dateVersion: millesime.dateVersion } : null;
  }
}
