import { BadRequestException, Injectable } from '@nestjs/common';
import {
  IndicateurDefinition,
  IndicateurPeriodicite,
  IndicateurValeur,
  IndicateurValeurWithIdentifiant,
} from '@tet/domain/indicateurs';
import { isNil, partition, round } from 'es-toolkit';
import { AuthenticatedUser } from '../../users/models/auth.models';
import { IndicateurDefinitionLockRepository } from '../definitions/indicateur-definition-lock.repository';
import { CrudValeursRepository } from './crud-valeurs.repository';
import { IndicateurValeurLockRepository } from './indicateur-valeur-lock.repository';
import { IndicateurValeursWriteContext } from './indicateur-valeurs-context';
import { captureIndicateurValeursResult } from './indicateur-valeurs.errors';
import {
  hydrateIndicateurPeriod,
  getLegacyIndicateurPeriodicite,
  dehydrateIndicateurPeriod,
} from './indicateur-period.adapter';
import { UpsertValeurIndicateur } from './upsert-valeur-indicateur.request';
import { assertUserIndicateurValeursAllowed } from './user-indicateur-valeur.rules';
import {
  PreparedIndicateurValeurs,
  ValidateIndicateurValeursWriteService,
} from './validate-indicateur-valeurs-write.service';

/** Persists values under the caller's transaction; recalculation stays in the reconciliation service. */
@Injectable()
export class WriteIndicateurValeursService {
  constructor(
    private readonly repository: CrudValeursRepository,
    private readonly validationService: ValidateIndicateurValeursWriteService,
    private readonly definitionLockRepository: IndicateurDefinitionLockRepository,
    private readonly lockRepository: IndicateurValeurLockRepository
  ) {}

  async saveBatch(
    input: PreparedIndicateurValeurs,
    context: IndicateurValeursWriteContext
  ) {
    const validation = await this.validationService.validate(input, context);
    if (!validation.success) return validation;
    return captureIndicateurValeursResult(
      async (): Promise<IndicateurValeurWithIdentifiant[]> => {
        const valeurs = input.valeurs.map((valeur) => {
          const definition = validation.data[valeur.indicateurId];
          return {
            ...valeur,
            periodicite: getLegacyIndicateurPeriodicite(valeur.periodicite),
            dateValeur: this.getCanonicalDateValeur(valeur.dateValeur, {
              id: definition.id,
              periodicite: getLegacyIndicateurPeriodicite(valeur.periodicite),
            }),
            resultat: !isNil(valeur.resultat)
              ? round(valeur.resultat, definition.precision)
              : null,
            objectif: !isNil(valeur.objectif)
              ? round(valeur.objectif, definition.precision)
              : null,
          };
        });
        await this.lockRepository.lock(valeurs, context.tx);
        const [withMetadata, withoutMetadata] = partition(valeurs, (valeur) =>
          Boolean(valeur.metadonneeId)
        );
        const saved: IndicateurValeurWithIdentifiant[] = [
          ...(withMetadata.length
            ? await this.repository.upsertValeursWithMetadata(
                withMetadata,
                context.tx
              )
            : []),
          ...(withoutMetadata.length
            ? await this.repository.upsertValeursWithoutMetadata(
                withoutMetadata,
                context.tx
              )
            : []),
        ];
        const metadataIds = [
          ...new Set(
            saved.flatMap(({ metadonneeId }) =>
              metadonneeId == null ? [] : [metadonneeId]
            )
          ),
        ];
        const metadataSources = metadataIds.length
          ? await this.repository.listMetadataSources(metadataIds, context.tx)
          : [];
        const sourceIdByMetadataId = new Map(
          metadataSources.map(({ id, sourceId }) => [id, sourceId])
        );
        return saved.map((valeur) => ({
          ...valeur,
          ...(valeur.metadonneeId == null
            ? {}
            : { sourceId: sourceIdByMetadataId.get(valeur.metadonneeId) }),
          indicateurIdentifiant:
            valeur.indicateurIdentifiant ||
            validation.data[valeur.indicateurId]?.identifiantReferentiel,
        }));
      }
    );
  }

  saveSingle(
    {
      data,
    }: {
      data: UpsertValeurIndicateur;
      definition: Pick<IndicateurDefinition, 'periodicite'>;
    },
    { user, tx }: IndicateurValeursWriteContext & { user: AuthenticatedUser }
  ) {
    return captureIndicateurValeursResult(
      async (): Promise<IndicateurValeur | undefined> => {
        const { collectiviteId, indicateurId } = data;
        const [lockedDefinition] =
          await this.definitionLockRepository.lockDefinitions(
            [indicateurId],
            tx
          );
        if (!lockedDefinition)
          throw new BadRequestException(
            `Indicateur definition not found for id ${indicateurId}`
          );
        assertUserIndicateurValeursAllowed([lockedDefinition]);
        const periodicite = getLegacyIndicateurPeriodicite(data.periodicite);
        const dateValeur =
          data.dateValeur === undefined
            ? undefined
            : this.getCanonicalDateValeur(data.dateValeur, {
                id: indicateurId,
                periodicite,
              });
        const now = new Date().toISOString();
        const fields = {
          resultat: !isNil(data.resultat)
            ? round(data.resultat, lockedDefinition.precision)
            : data.resultat,
          objectif: !isNil(data.objectif)
            ? round(data.objectif, lockedDefinition.precision)
            : data.objectif,
          resultatCommentaire: data.resultatCommentaire,
          objectifCommentaire: data.objectifCommentaire,
          calculAuto: false,
          calculAutoIdentifiantsManquants: null,
          modifiedBy: user.id,
          modifiedAt: now,
        };
        if (!isNil(data.id)) {
          const key = { collectiviteId, indicateurId, id: data.id };
          const existing = await this.repository.findUserValeur(key, tx);
          if (!existing) return undefined;
          this.assertPeriodiciteAllowed(lockedDefinition, existing.periodicite);
          if (
            data.periodicite !== undefined &&
            existing.periodicite !== data.periodicite
          ) {
            throw new BadRequestException(
              'La périodicité de la valeur ne correspond pas à la série demandée'
            );
          }
          await this.lockRepository.lock([existing], tx);
          return (
            (await this.repository.updateUserValeur(key, fields, tx)) ??
            undefined
          );
        }
        this.assertPeriodiciteAllowed(lockedDefinition, periodicite);
        if (dateValeur === undefined)
          throw new BadRequestException('Une valeur ou une date est requise');
        await this.lockRepository.lock([{ collectiviteId, dateValeur }], tx);
        return (
          (await this.repository.upsertUserValeur(
            {
              ...fields,
              collectiviteId,
              indicateurId,
              dateValeur,
              periodicite,
              createdBy: user.id,
              createdAt: now,
              metadonneeId: null,
            },
            tx
          )) ?? undefined
        );
      }
    );
  }
  private assertPeriodiciteAllowed(
    definition: Pick<IndicateurDefinition, 'periodicite' | 'periodiciteMode'>,
    periodicite: IndicateurPeriodicite
  ) {
    if (
      definition.periodiciteMode === 'imposee' &&
      definition.periodicite !== periodicite
    ) {
      throw new BadRequestException(
        'La valeur doit respecter la périodicité imposée'
      );
    }
  }
  private getCanonicalDateValeur(
    dateValeur: string,
    definition: Pick<IndicateurDefinition, 'id' | 'periodicite'>
  ): string {
    try {
      return dehydrateIndicateurPeriod(
        hydrateIndicateurPeriod({
          periodicite: definition.periodicite,
          dateValeur,
        })
      );
    } catch {
      throw new BadRequestException(
        `Date de valeur ${dateValeur} non canonique pour l'indicateur ${definition.id} (${definition.periodicite})`
      );
    }
  }
}
