import { Injectable } from '@nestjs/common';
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
import {
  combineResults,
  failure,
  Result,
  success,
} from '@tet/backend/utils/result.type';
import { IndicateurValeursRules } from '../indicateur-valeurs.rules';
import { FillMissingIndicateurValeursRules } from './fill-missing-indicateur-valeurs.rules';
import { AuthenticatedUser } from '../../../users/models/auth.models';
import { IndicateurLockRepository } from '../../indicateur/indicateur-lock.repository';
import { IndicateurValeursRepository } from '../indicateur-valeurs.repository';
import { IndicateurValeurLockRepository } from '../indicateur-valeur-lock.repository';
import { IndicateurValeursWriteContext } from '../indicateur-valeurs-context.types';
import {
  captureIndicateurValeursResult,
  captureIndicateurValeursResultOf,
  getIndicateurValeursDataOrThrow,
  IndicateurValeursError,
  toNonCanonicalDateValeurFailure,
} from '../indicateur-valeurs.errors';
import { UpsertValeurIndicateur } from './upsert-valeur-indicateur.request';
import { toUserValeurNotAllowedFailure } from './user-indicateur-valeur.errors';
import { getIndicateurIdsWithoutUserValeur } from './user-indicateur-valeur.rules';
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
    const valeurs = getIndicateurValeursDataOrThrow(
      combineResults(
        input.valeurs.map((valeur) =>
          this.normalizeValeur(valeur, indicateurs[valeur.indicateurId])
        )
      )
    );
    await this.lockRepository.lock(valeurs, context.tx);
    return { valeurs, indicateurs };
  }

  private normalizeValeur(
    valeur: IndicateurValeurCreate,
    indicateur: Indicateur
  ): Result<IndicateurValeurCreate, 'INVALID_VALUE'> {
    const normalized = IndicateurValeursRules.normalize(valeur, indicateur);
    if (normalized === null) {
      return toNonCanonicalDateValeurFailure({
        dateValeur: valeur.dateValeur,
        indicateurId: indicateur.id,
        periodicite: valeur.periodicite ?? IndicateurPeriodiciteEnum.ANNUELLE,
      });
    }
    return success(normalized);
  }

  private resolveDateValeur({
    dateValeur,
    indicateurId,
    periodicite,
  }: {
    dateValeur: string | undefined;
    indicateurId: number;
    periodicite: IndicateurPeriodicite;
  }): Result<string | undefined, 'INVALID_VALUE'> {
    if (dateValeur === undefined) return success(undefined);
    const canonicalDateValeur = IndicateurValeursRules.getCanonicalDateValeur(
      dateValeur,
      { id: indicateurId, periodicite }
    );
    if (canonicalDateValeur === null) {
      return toNonCanonicalDateValeurFailure({
        dateValeur,
        indicateurId,
        periodicite,
      });
    }
    return success(canonicalDateValeur);
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
    return captureIndicateurValeursResultOf(
      async (): Promise<
        Result<IndicateurValeur | undefined, IndicateurValeursError>
      > => {
        const { collectiviteId, indicateurId } = data;
        const [lockedIndicateur] = getIndicateurDataOrThrow(
          await this.indicateurLockRepository.lockIndicateurs(
            [indicateurId],
            tx
          )
        );
        if (!lockedIndicateur)
          return failure(
            'INDICATEUR_NOT_AVAILABLE',
            new Error(`Indicateur definition not found for id ${indicateurId}`)
          );
        const protectedIndicateurIds = getIndicateurIdsWithoutUserValeur([
          lockedIndicateur,
        ]);
        if (protectedIndicateurIds.length > 0) {
          return toUserValeurNotAllowedFailure(protectedIndicateurIds);
        }
        const periodicite =
          data.periodicite ?? IndicateurPeriodiciteEnum.ANNUELLE;
        const dateValeurResult = this.resolveDateValeur({
          dateValeur: data.dateValeur,
          indicateurId,
          periodicite,
        });
        if (!dateValeurResult.success) return dateValeurResult;
        const dateValeur = dateValeurResult.data;
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
          if (!existing) return success(undefined);
          const existingPeriodiciteCheck = this.checkPeriodiciteAllowed(
            lockedIndicateur,
            existing.periodicite
          );
          if (!existingPeriodiciteCheck.success)
            return failure(
              existingPeriodiciteCheck.error,
              existingPeriodiciteCheck.cause
            );
          if (
            data.periodicite !== undefined &&
            existing.periodicite !== data.periodicite
          ) {
            return failure(
              'PERIODICITE_MISMATCH',
              new Error(
                'La périodicité de la valeur ne correspond pas à la série demandée'
              )
            );
          }
          await this.lockRepository.lock([existing], tx);
          return success(
            (await this.repository.updateUserValeur(key, fields, tx)) ??
              undefined
          );
        }
        const requestedPeriodiciteCheck = this.checkPeriodiciteAllowed(
          lockedIndicateur,
          periodicite
        );
        if (!requestedPeriodiciteCheck.success)
          return failure(
            requestedPeriodiciteCheck.error,
            requestedPeriodiciteCheck.cause
          );
        if (dateValeur === undefined)
          return failure(
            'INVALID_VALUE',
            new Error('Une valeur ou une date est requise')
          );
        await this.lockRepository.lock([{ collectiviteId, dateValeur }], tx);
        return success(
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
  private checkPeriodiciteAllowed(
    indicateur: Pick<Indicateur, 'periodicite'>,
    periodicite: IndicateurPeriodicite
  ): Result<void, IndicateurValeursError> {
    if (indicateur.periodicite !== periodicite) {
      return failure(
        'PERIODICITE_MISMATCH',
        new Error('La valeur doit respecter la périodicité de déclaration')
      );
    }
    return success(undefined);
  }
}
