import { BadRequestException, Injectable } from '@nestjs/common';
import {
  Indicateur,
  IndicateurPeriodicite,
  IndicateurPeriodiciteEnum,
  IndicateurValeur,
  IndicateurValeurWithIdentifiant,
  IndicateurValeurCreate,
  COLLECTIVITE_SOURCE_ID,
} from '@tet/domain/indicateurs';
import { groupBy, isNil, partition, round } from 'es-toolkit';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { IndicateurValeursRules } from '../indicateur-valeurs.rules';
import { FillMissingIndicateurValeursRules } from './fill-missing-indicateur-valeurs.rules';
import { AuthenticatedUser } from '../../../users/models/auth.models';
import { IndicateurLockRepository } from '../../indicateur/indicateur-lock.repository';
import { IndicateurValeursRepository } from '../indicateur-valeurs.repository';
import { IndicateurValeurLockRepository } from '../indicateur-valeur-lock.repository';
import { IndicateurValeursWriteContext } from '../indicateur-valeurs-context.types';
import {
  captureIndicateurValeursResult,
  getIndicateurValeursDataOrThrow,
} from '../indicateur-valeurs.errors';
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

  saveBatch(
    input: PreparedIndicateurValeurs,
    context: IndicateurValeursWriteContext
  ) {
    return captureIndicateurValeursResult(async () => {
      const { valeurs, indicateurs } = await this.prepareBatch(input, context);
      return this.persist(valeurs, indicateurs, context.tx);
    });
  }

  fillMissing(
    input: PreparedIndicateurValeurs,
    context: IndicateurValeursWriteContext
  ) {
    return captureIndicateurValeursResult(async () => {
      const { valeurs, indicateurs } = await this.prepareBatch(input, context);
      const stored: IndicateurValeur[] = [];
      const scopes = groupBy(
        valeurs,
        (v) => `${v.collectiviteId}:${v.metadonneeId ?? 'collectivite'}`
      );
      for (const scope of Object.values(scopes)) {
        const first = scope[0];
        const dates = scope.map(({ dateValeur }) => dateValeur).sort();
        const listing = getIndicateurValeursDataOrThrow(
          await this.repository.listIndicateurValeurs(
            {
              collectiviteId: first.collectiviteId,
              indicateurIds: [
                ...new Set(scope.map(({ indicateurId }) => indicateurId)),
              ],
              ...(first.metadonneeId == null
                ? { sources: [COLLECTIVITE_SOURCE_ID] }
                : { metadonneeId: first.metadonneeId }),
              dateDebut: dates[0],
              dateFin: dates[dates.length - 1],
            },
            context.tx
          )
        );
        stored.push(...listing.map(({ indicateurValeur }) => indicateurValeur));
      }
      const merged = FillMissingIndicateurValeursRules.merge(valeurs, stored);
      return {
        valeurs: await this.persist(
          merged.valeurs,
          indicateurs,
          context.tx,
          'fill-missing'
        ),
        conflits: merged.conflits,
      };
    });
  }

  private async prepareBatch(
    input: PreparedIndicateurValeurs,
    context: IndicateurValeursWriteContext
  ) {
    const indicateurs = getIndicateurValeursDataOrThrow(
      await this.validationService.validate(input, context)
    );
    const valeurs = input.valeurs.map((valeur) =>
      IndicateurValeursRules.normalize(valeur, indicateurs[valeur.indicateurId])
    );
    await this.lockRepository.lock(valeurs, context.tx);
    return { valeurs, indicateurs };
  }

  private async persist(
    valeurs: IndicateurValeurCreate[],
    indicateurs: Record<number, Indicateur>,
    tx: Transaction,
    mode: 'replace' | 'fill-missing' = 'replace'
  ): Promise<IndicateurValeurWithIdentifiant[]> {
    const [withMetadata, withoutMetadata] = partition(valeurs, (valeur) =>
      Boolean(valeur.metadonneeId)
    );
    const saved =
      mode === 'fill-missing'
        ? await this.repository.fillMissingValeurs(valeurs, tx)
        : [
            ...(withMetadata.length
              ? await this.repository.upsertValeursWithMetadata(
                  withMetadata,
                  tx
                )
              : []),
            ...(withoutMetadata.length
              ? await this.repository.upsertValeursWithoutMetadata(
                  withoutMetadata,
                  tx
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
      ? await this.repository.listMetadataSources(metadataIds, tx)
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
        indicateurs[valeur.indicateurId]?.identifiantReferentiel,
    }));
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
            : IndicateurValeursRules.getCanonicalDateValeur(data.dateValeur, {
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
}
