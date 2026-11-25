import { Injectable, Logger } from '@nestjs/common';
import {
  catchDatabaseFailure,
  toDatabaseFailure,
} from '@tet/backend/utils/database/catch-database-failure';
import { Result, success } from '@tet/backend/utils/result.type';
import {
  COLLECTIVITE_SOURCE_ID,
  IndicateurSourceMetadonnee,
  IndicateurValeurAvecMetadonnesDefinition,
} from '@tet/domain/indicateurs';
import { isNil } from 'es-toolkit';
import { ListCollectiviteIndicateursRepository } from '../../indicateurs/list-collectivite-indicateurs/list-collectivite-indicateurs.repository';
import { TrajectoireSnbc3FeatureFlagService } from '../../trajectoires/trajectoire-snbc3-feature-flag.service';
import { IndicateurValeursReadAccessService } from '../indicateur-valeurs-read-access.service';
import { IndicateurValeursRepository } from '../indicateur-valeurs.repository';
import { GetIndicateursValeursResponse } from './get-indicateur-valeurs.response';
import { ListIndicateurValeursInput } from './list-indicateur-valeurs.input';
import { IndicateurValeursContext } from '../indicateur-valeurs-context.types';
import {
  IndicateurValeursError,
  toMissingIndicateurSelectionFailure,
  toReadContextRequiredFailure,
  toReadValeursDeniedFailure,
} from '../indicateur-valeurs.errors';
import {
  deduplicateIndicateurValeursBySource,
  groupIndicateurValeursBySource,
} from './indicateur-valeurs-read.adapter';

@Injectable()
export class ListIndicateurValeursService {
  private readonly logger = new Logger(ListIndicateurValeursService.name);
  constructor(
    private readonly repository: IndicateurValeursRepository,
    private readonly readAccessService: IndicateurValeursReadAccessService,
    private readonly listCollectiviteIndicateursRepository: ListCollectiviteIndicateursRepository,
    private readonly trajectoireSnbc3FeatureFlag: TrajectoireSnbc3FeatureFlagService
  ) {}

  async get(
    options: ListIndicateurValeursInput & { ignoreDedoublonnage?: boolean },
    context: Extract<IndicateurValeursContext, { isUserTrusted: true }>
  ): Promise<
    Result<IndicateurValeurAvecMetadonnesDefinition[], IndicateurValeursError>
  > {
    return catchDatabaseFailure(async () => {
      const listing = await this.repository.listIndicateurValeurs(
        options,
        context.tx
      );
      if (!listing.success) return listing;
      return success(
        options.ignoreDedoublonnage
          ? listing.data
          : deduplicateIndicateurValeursBySource(listing.data)
      );
    });
  }

  list(
    options: ListIndicateurValeursInput,
    context: IndicateurValeursContext
  ): Promise<Result<GetIndicateursValeursResponse, IndicateurValeursError>> {
    return catchDatabaseFailure(() => this.listAuthorized(options, context));
  }

  private async resolveHasPermissionLecture(
    { collectiviteId }: ListIndicateurValeursInput,
    { user, isUserTrusted = false, tx }: IndicateurValeursContext
  ): Promise<Result<boolean, IndicateurValeursError>> {
    if (isUserTrusted) return success(true);
    if (!user) return toReadContextRequiredFailure(collectiviteId);
    const readerResult = await this.readAccessService.resolveReader({
      collectiviteId,
      user,
      tx,
    });
    if (!readerResult.success) {
      return toReadValeursDeniedFailure({
        userId: user.id,
        collectiviteId,
        denial: readerResult.error,
      });
    }
    return success(readerResult.data === 'member');
  }

  private async listAuthorized(
    options: ListIndicateurValeursInput,
    context: IndicateurValeursContext
  ): Promise<Result<GetIndicateursValeursResponse, IndicateurValeursError>> {
    const { user, tx } = context;
    const { collectiviteId, indicateurIds, identifiantsReferentiel } = options;

    const permissionLecture = await this.resolveHasPermissionLecture(
      options,
      context
    );
    if (!permissionLecture.success) return permissionLecture;
    const hasPermissionLecture = permissionLecture.data;

    if (!indicateurIds?.length && !identifiantsReferentiel?.length) {
      return toMissingIndicateurSelectionFailure();
    }

    // Point de passage des fiches indicateurs, du tRPC et de l'API publique :
    // la SNBC 3 n'y apparaît qu'avec le feature flag.
    const listing = await this.get(options, { isUserTrusted: true, tx });
    if (!listing.success) return listing;
    const indicateurValeurs =
      await this.trajectoireSnbc3FeatureFlag.filterSourcesSnbc3(
        listing.data,
        (v) => v.indicateurSourceMetadonnee?.sourceId,
        user,
        collectiviteId,
        context.isUserTrusted ? context.trajectoireSnbc3Enabled : undefined
      );

    const indicateurValeursSeules = indicateurValeurs.map((v) => ({
      ...v.indicateurValeur,
      confidentiel: v.confidentiel,
    }));

    const definitions =
      await this.listCollectiviteIndicateursRepository.listCollectiviteIndicateurs(
        {
          indicateurIds: options.indicateurIds,
          identifiantsReferentiel: options.identifiantsReferentiel,
          collectiviteId,
        },
        tx
      );
    if (!definitions.success) return toDatabaseFailure(definitions);
    const uniqueIndicateurs = definitions.data;

    options.identifiantsReferentiel?.forEach((identifiant) => {
      if (
        !uniqueIndicateurs.find((d) => d.identifiantReferentiel === identifiant)
      ) {
        this.logger.warn(
          `Définition de l'indicateur avec l'identifiant référentiel ${identifiant} introuvable`
        );
      }
    });

    options.indicateurIds?.forEach((indicateurId) => {
      if (!uniqueIndicateurs.find((d) => d.id === indicateurId)) {
        this.logger.warn(
          `Définition de l'indicateur avec l'identifiant ${indicateurId} introuvable`
        );
      }
    });

    uniqueIndicateurs.sort((a, b) => {
      if (!a.identifiantReferentiel && !b.identifiantReferentiel) {
        return 0;
      }
      if (!a.identifiantReferentiel) {
        return 1;
      }
      if (!b.identifiantReferentiel) {
        return -1;
      }
      return a.identifiantReferentiel.localeCompare(b.identifiantReferentiel);
    });

    const initialMetadonneesAcc: {
      [key: string]: IndicateurSourceMetadonnee;
    } = {};
    const uniqueIndicateurMetadonnees = Object.values(
      indicateurValeurs.reduce((acc, v) => {
        if (v.indicateurSourceMetadonnee?.id) {
          acc[v.indicateurSourceMetadonnee.id.toString()] =
            v.indicateurSourceMetadonnee;
        }
        return acc;
      }, initialMetadonneesAcc)
    ) as IndicateurSourceMetadonnee[];

    const sourceIds = [
      ...new Set(
        uniqueIndicateurMetadonnees.map((metadonnee) => metadonnee.sourceId)
      ),
    ];

    const sources = await this.repository.listSources(sourceIds, tx);

    const indicateurValeurGroupeesParSource = groupIndicateurValeursBySource(
      indicateurValeursSeules,
      uniqueIndicateurs,
      uniqueIndicateurMetadonnees,
      sources,
      false
    );

    // Filtre la dernière valeur résultat d'un indicateur confidentiel quand
    // l'utilisateur n'a pas le droit requis
    if (!hasPermissionLecture) {
      indicateurValeurGroupeesParSource.forEach((indicateur) => {
        const sourceCollectivite = indicateur.sources[COLLECTIVITE_SOURCE_ID];
        if (sourceCollectivite?.valeurs?.[0]?.confidentiel) {
          // recherche la date la plus récente avec un résultat
          const timeDerniereValeur = Math.max(
            ...sourceCollectivite.valeurs
              .filter((v) => !isNil(v.resultat))
              .map((v) =>
                v.dateValeur ? new Date(v.dateValeur as string).getTime() : 0
              )
          );
          sourceCollectivite.valeurs = sourceCollectivite.valeurs.map((v) => ({
            ...v,
            // masque le résultat si nécessaire
            resultat:
              !isNil(v.resultat) &&
              v.dateValeur &&
              new Date(v.dateValeur as string).getTime() === timeDerniereValeur
                ? null
                : v.resultat,
          }));
        }
      });
    }
    return success({
      count: indicateurValeurGroupeesParSource.length,
      indicateurs: indicateurValeurGroupeesParSource,
    });
  }
}
