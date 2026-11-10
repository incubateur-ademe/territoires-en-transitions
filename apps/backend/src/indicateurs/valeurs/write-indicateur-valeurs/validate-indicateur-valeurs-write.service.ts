import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import type { Transaction } from '@tet/backend/utils/database/transaction.utils';
import {
  Indicateur,
  IndicateurPeriodiciteEnum,
  IndicateurValeurCreate,
  isIndicateurPerso,
  INDICATEUR_SOURCES_WITH_DEDICATED_METADATA,
} from '@tet/domain/indicateurs';
import { PermissionOperationEnum, ResourceType } from '@tet/domain/users';
import { isNil, isNotNil, keyBy } from 'es-toolkit';
import { AuthRole } from '../../../users/models/auth.models';
import { IndicateurLockRepository } from '../../indicateur/indicateur-lock.repository';
import { IndicateurValeursRepository } from '../indicateur-valeurs.repository';
import {
  IndicateurValeursContext,
  IndicateurValeursWriteContext,
} from '../indicateur-valeurs-context.types';
import { captureIndicateurValeursResult } from '../indicateur-valeurs.errors';
import { assertUserIndicateurValeursAllowed } from './user-indicateur-valeur.rules';
import { getIndicateurDataOrThrow } from '../../indicateur/indicateur-nature.utils';

export type PreparedIndicateurValeurs = {
  valeurs: IndicateurValeurCreate[];
};

@Injectable()
export class ValidateIndicateurValeursWriteService {
  constructor(
    private readonly repository: IndicateurValeursRepository,
    private readonly permissionService: PermissionService,
    private readonly indicateurLockRepository: IndicateurLockRepository
  ) {}

  prepare(
    valeurs: IndicateurValeurCreate[],
    context: IndicateurValeursContext
  ) {
    return captureIndicateurValeursResult(
      async (): Promise<PreparedIndicateurValeurs> => {
        const { user, isUserTrusted = false } = context;
        if (!isUserTrusted && user) {
          for (const collectiviteId of new Set(
            valeurs.map((v) => v.collectiviteId)
          )) {
            await this.permissionService.assertAllowed(
              user,
              PermissionOperationEnum['INDICATEURS.VALEURS.MUTATE'],
              ResourceType.COLLECTIVITE,
              { collectiviteId },
              context.tx
            );
          }
        } else if (!isUserTrusted) {
          throw new ForbiddenException(
            'Un contexte utilisateur ou une capacité interne explicite est requis pour écrire des valeurs'
          );
        }
        return {
          valeurs: valeurs.map((valeur) =>
            !isUserTrusted && user?.role === AuthRole.AUTHENTICATED && user.id
              ? {
                  ...valeur,
                  calculAuto: false,
                  calculAutoIdentifiantsManquants: null,
                  createdBy: user.id,
                  modifiedBy: user.id,
                }
              : valeur
          ),
        };
      }
    );
  }

  validate(
    input: PreparedIndicateurValeurs,
    context: IndicateurValeursWriteContext
  ) {
    return captureIndicateurValeursResult(async () => {
      const { tx, user, isUserTrusted = false } = context;
      const indicateurIds = [
        ...new Set(input.valeurs.map((v) => v.indicateurId)),
      ];
      const indicateurs = getIndicateurDataOrThrow(
        await this.indicateurLockRepository.lockIndicateurs(indicateurIds, tx)
      );
      const indicateursById = keyBy(indicateurs, (d) => d.id);
      const enforceUserRules =
        !isUserTrusted && user?.role === AuthRole.AUTHENTICATED;
      if (enforceUserRules) assertUserIndicateurValeursAllowed(indicateurs);
      await this.assertIndicateurValeursAvailableForWrite(
        input.valeurs,
        indicateursById,
        enforceUserRules,
        tx
      );
      const metadataIds = [
        ...new Set(
          input.valeurs.flatMap(({ metadonneeId }) =>
            metadonneeId == null ? [] : [metadonneeId]
          )
        ),
      ];
      const metadataSources = metadataIds.length
        ? await this.repository.listMetadataSources(metadataIds, tx)
        : [];
      const localSourceByMetadataId = new Map(
        metadataSources
          .filter(({ sourceId }) =>
            INDICATEUR_SOURCES_WITH_DEDICATED_METADATA.includes(sourceId)
          )
          .map(({ id, sourceId }) => [id, sourceId])
      );
      for (const valeur of input.valeurs) {
        const indicateur = indicateursById[valeur.indicateurId];
        if (enforceUserRules && valeur.metadonneeId != null) {
          const authorization = !context.isUserTrusted
            ? context.metadataAuthorization
            : undefined;
          if (
            !localSourceByMetadataId.has(valeur.metadonneeId) ||
            authorization?.collectiviteId !== valeur.collectiviteId ||
            authorization?.metadonneeId !== valeur.metadonneeId ||
            authorization?.sourceId !==
              localSourceByMetadataId.get(valeur.metadonneeId)
          ) {
            throw new ForbiddenException(
              "L'écriture sous une métadonnée nécessite une autorisation interne dédiée"
            );
          }
        }
        if (
          (valeur.metadonneeId == null ||
            localSourceByMetadataId.has(valeur.metadonneeId)) &&
          indicateur.periodicite !==
            (valeur.periodicite ?? IndicateurPeriodiciteEnum.ANNUELLE)
        ) {
          throw new BadRequestException(
            'La valeur doit respecter la périodicité de déclaration'
          );
        }
      }
      return indicateursById;
    });
  }
  private async assertIndicateurValeursAvailableForWrite(
    valeurs: IndicateurValeurCreate[],
    indicateursById: Partial<Record<number, Indicateur>>,
    enforceGroupementMembership: boolean,
    tx: Transaction
  ): Promise<void> {
    const groupementScopes: Array<{
      indicateurId: number;
      groupementId: number;
      collectiviteId: number;
    }> = [];

    for (const valeur of valeurs) {
      const indicateur = indicateursById[valeur.indicateurId];
      if (!indicateur) {
        throw new BadRequestException(
          `Indicateur definition not found for id ${valeur.indicateurId}`
        );
      }
      if (
        isIndicateurPerso(indicateur) &&
        indicateur.collectiviteId !== valeur.collectiviteId
      ) {
        throw new BadRequestException(
          `Indicateur ${valeur.indicateurId} non disponible pour la collectivité ${valeur.collectiviteId}`
        );
      }
      if (enforceGroupementMembership && isNotNil(indicateur.groupementId)) {
        groupementScopes.push({
          indicateurId: valeur.indicateurId,
          groupementId: indicateur.groupementId,
          collectiviteId: valeur.collectiviteId,
        });
      }
    }

    if (groupementScopes.length === 0) return;

    const memberships = await this.repository.lockGroupementMemberships(
      groupementScopes.map(({ groupementId, collectiviteId }) => ({
        groupementId,
        collectiviteId,
      })),
      tx
    );
    const memberCollectiviteIdsByGroupementId = new Map<number, Set<number>>();
    for (const membership of memberships) {
      if (isNil(membership.groupementId) || isNil(membership.collectiviteId)) {
        continue;
      }
      const collectiviteIds =
        memberCollectiviteIdsByGroupementId.get(membership.groupementId) ??
        new Set<number>();
      collectiviteIds.add(membership.collectiviteId);
      memberCollectiviteIdsByGroupementId.set(
        membership.groupementId,
        collectiviteIds
      );
    }

    for (const scope of groupementScopes) {
      if (
        !memberCollectiviteIdsByGroupementId
          .get(scope.groupementId)
          ?.has(scope.collectiviteId)
      ) {
        throw new BadRequestException(
          `Indicateur ${scope.indicateurId} non disponible pour la collectivité ${scope.collectiviteId}`
        );
      }
    }
  }
}
