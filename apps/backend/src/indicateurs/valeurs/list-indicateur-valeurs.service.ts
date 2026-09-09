import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
} from '@nestjs/common';
import CollectivitesService from '@tet/backend/collectivites/services/collectivites.service';
import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import {
  COLLECTIVITE_SOURCE_ID,
  IndicateurSourceMetadonnee,
} from '@tet/domain/indicateurs';
import { ResourceType } from '@tet/domain/users';
import { isNil } from 'es-toolkit';
import { ListCollectiviteDefinitionsRepository } from '../definitions/list-collectivite-definitions/list-collectivite-definitions.repository';
import { CrudValeursRepository } from './crud-valeurs.repository';
import { ListIndicateurValeursInput } from './list-indicateur-valeurs.input';
import { IndicateurValeursContext } from './indicateur-valeurs-context';
import {
  captureIndicateurValeursResult,
  getIndicateurValeursDataOrThrow,
} from './indicateur-valeurs.errors';
import {
  deduplicateIndicateurValeursBySource,
  groupIndicateurValeursBySource,
} from './indicateur-valeurs-read.adapter';

@Injectable()
export class ListIndicateurValeursService {
  private readonly logger = new Logger(ListIndicateurValeursService.name);
  constructor(
    private readonly repository: CrudValeursRepository,
    private readonly permissionService: PermissionService,
    private readonly collectiviteService: CollectivitesService,
    private readonly listCollectiviteDefinitionsRepository: ListCollectiviteDefinitionsRepository
  ) {}

  get(
    options: ListIndicateurValeursInput & { ignoreDedoublonnage?: boolean },
    context: Extract<IndicateurValeursContext, { isUserTrusted: true }>
  ) {
    return captureIndicateurValeursResult(async () => {
      const valeurs = await this.repository.listIndicateurValeurs(
        options,
        context.tx
      );
      return options.ignoreDedoublonnage
        ? valeurs
        : deduplicateIndicateurValeursBySource(valeurs);
    });
  }

  list(options: ListIndicateurValeursInput, context: IndicateurValeursContext) {
    return captureIndicateurValeursResult(() =>
      this.listAuthorized(options, context)
    );
  }
  private async listAuthorized(
    options: ListIndicateurValeursInput,
    context: IndicateurValeursContext
  ) {
    const { user, isUserTrusted = false } = context;
    const { collectiviteId, indicateurIds, identifiantsReferentiel } = options;

    // Vérifie les droits
    let hasPermissionLecture;
    if (!isUserTrusted && user) {
      const collectivitePrivate = await this.collectiviteService.isPrivate(
        collectiviteId
      );
      const permissionLectureResult = await this.permissionService.isAllowed(
        user,
        'indicateurs.valeurs.read_confidentiel',
        ResourceType.COLLECTIVITE,
        { collectiviteId }
      );
      const permissionVisiteResult = await this.permissionService.isAllowed(
        user,
        'indicateurs.valeurs.read',
        ResourceType.COLLECTIVITE,
        { collectiviteId }
      );
      const accesRestreintRequis =
        collectivitePrivate && !permissionLectureResult.success;
      if (accesRestreintRequis || !permissionVisiteResult.success) {
        throw new ForbiddenException(
          `Droits insuffisants, l'utilisateur ${
            user.id
          } n'a pas l'autorisation ${
            accesRestreintRequis
              ? 'indicateurs.valeurs.read_confidentiel'
              : 'indicateurs.valeurs.read'
          } sur la ressource Collectivité ${collectiviteId}`
        );
      }
      hasPermissionLecture = permissionLectureResult.success;
    } else if (isUserTrusted) {
      hasPermissionLecture = true;
    } else {
      throw new ForbiddenException(
        `Un contexte utilisateur ou une capacité interne explicite est requis pour lire les valeurs de la collectivité ${collectiviteId}`
      );
    }

    if (!indicateurIds?.length && !identifiantsReferentiel?.length) {
      throw new BadRequestException(
        `indicateurIds or identifiantsReferentiel required`
      );
    }

    const indicateurValeurs = getIndicateurValeursDataOrThrow(
      await this.get(options, { isUserTrusted: true, tx: context.tx })
    );

    const indicateurValeursSeules = indicateurValeurs.map((v) => ({
      ...v.indicateurValeur,
      confidentiel: v.confidentiel,
    }));

    const uniqueIndicateurDefinitions =
      await this.listCollectiviteDefinitionsRepository.listCollectiviteDefinitions(
        {
          indicateurIds: options.indicateurIds,
          identifiantsReferentiel: options.identifiantsReferentiel,
          collectiviteId,
        }
      );

    options.identifiantsReferentiel?.forEach((identifiant) => {
      if (
        !uniqueIndicateurDefinitions.find(
          (d) => d.identifiantReferentiel === identifiant
        )
      ) {
        this.logger.warn(
          `Définition de l'indicateur avec l'identifiant référentiel ${identifiant} introuvable`
        );
      }
    });

    options.indicateurIds?.forEach((indicateurId) => {
      if (!uniqueIndicateurDefinitions.find((d) => d.id === indicateurId)) {
        this.logger.warn(
          `Définition de l'indicateur avec l'identifiant ${indicateurId} introuvable`
        );
      }
    });

    uniqueIndicateurDefinitions.sort((a, b) => {
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

    const sources = await this.repository.listSources(sourceIds);

    const indicateurValeurGroupeesParSource = groupIndicateurValeursBySource(
      indicateurValeursSeules,
      uniqueIndicateurDefinitions.map((definition) => ({
        ...definition,
        periodicite: options.periodicite ?? definition.periodicite,
      })),
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
    return {
      count: indicateurValeurGroupeesParSource.length,
      indicateurs: indicateurValeurGroupeesParSource,
    };
  }
}
