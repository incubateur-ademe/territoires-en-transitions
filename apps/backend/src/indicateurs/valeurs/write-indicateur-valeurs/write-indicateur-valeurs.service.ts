import { BadRequestException, Injectable } from '@nestjs/common';
import {
  Indicateur,
  IndicateurPeriodicite,
  IndicateurPeriodiciteEnum,
  IndicateurPeriodes,
  IndicateurValeur,
  IndicateurValeurWithIdentifiant,
} from '@tet/domain/indicateurs';
import { isNil, partition, round } from 'es-toolkit';
import { AuthenticatedUser } from '../../../users/models/auth.models';
import { IndicateurLockRepository } from '../../indicateur/indicateur-lock.repository';
import { IndicateurValeursRepository } from '../indicateur-valeurs.repository';
import { IndicateurValeurLockRepository } from '../indicateur-valeur-lock.repository';
import { IndicateurValeursWriteContext } from '../indicateur-valeurs-context.types';
import { captureIndicateurValeursResult } from '../indicateur-valeurs.errors';
import { UpsertValeurIndicateur } from './upsert-valeur-indicateur.request';
import { assertUserIndicateurValeursAllowed } from './user-indicateur-valeur.rules';
import {
  PreparedIndicateurValeurs,
  ValidateIndicateurValeursWriteService,
} from './validate-indicateur-valeurs-write.service';
import { getIndicateurDataOrThrow } from '../../indicateur/indicateur-nature.utils';

/** Persists values under the caller's transaction; recalculation stays in the reconciliation service. */
@Injectable()
export class WriteIndicateurValeursService {
  constructor(
    private readonly repository: IndicateurValeursRepository,
    private readonly validationService: ValidateIndicateurValeursWriteService,
    private readonly indicateurLockRepository: IndicateurLockRepository,
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
          const indicateur = validation.data[valeur.indicateurId];
          const periodicite =
            valeur.periodicite ?? IndicateurPeriodiciteEnum.ANNUELLE;
          return {
            ...valeur,
            periodicite,
            dateValeur: this.getCanonicalDateValeur(valeur.dateValeur, {
              id: indicateur.id,
              periodicite,
            }),
            resultat: !isNil(valeur.resultat)
              ? round(valeur.resultat, indicateur.precision)
              : null,
            objectif: !isNil(valeur.objectif)
              ? round(valeur.objectif, indicateur.precision)
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
    { data }: { data: UpsertValeurIndicateur },
    { user, tx }: IndicateurValeursWriteContext & { user: AuthenticatedUser }
  ) {
    return captureIndicateurValeursResult(
      async (): Promise<IndicateurValeur | undefined> => {
        const { collectiviteId, indicateurId } = data;
        const [lockedIndicateur] = getIndicateurDataOrThrow(
          await this.indicateurLockRepository.lockIndicateurs(
            [indicateurId],
            tx
          )
        );
        if (!lockedIndicateur)
          throw new BadRequestException(
            `Indicateur definition not found for id ${indicateurId}`
          );
        assertUserIndicateurValeursAllowed([lockedIndicateur]);
        const periodicite =
          data.periodicite ?? IndicateurPeriodiciteEnum.ANNUELLE;
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
            ? round(data.resultat, lockedIndicateur.precision)
            : data.resultat,
          objectif: !isNil(data.objectif)
            ? round(data.objectif, lockedIndicateur.precision)
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
          this.assertPeriodiciteAllowed(lockedIndicateur, existing.periodicite);
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
        this.assertPeriodiciteAllowed(lockedIndicateur, periodicite);
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
    indicateur: Pick<Indicateur, 'periodicite'>,
    periodicite: IndicateurPeriodicite
  ) {
    if (indicateur.periodicite !== periodicite) {
      throw new BadRequestException(
        'La valeur doit respecter la périodicité de déclaration'
      );
    }
  }
  private getCanonicalDateValeur(
    dateValeur: string,
    indicateur: Pick<Indicateur, 'id' | 'periodicite'>
  ): string {
    try {
      // The annual API accepts any date in the year; storage uses its first day.
      const periode =
        indicateur.periodicite === IndicateurPeriodiciteEnum.ANNUELLE
          ? IndicateurPeriodes.containing(indicateur.periodicite, dateValeur)
          : IndicateurPeriodes.fromDateValeur(
              indicateur.periodicite,
              dateValeur
            );
      return IndicateurPeriodes.toDateValeur(periode);
    } catch {
      throw new BadRequestException(
        `Date de valeur ${dateValeur} non canonique pour l'indicateur ${indicateur.id} (${indicateur.periodicite})`
      );
    }
  }
}
