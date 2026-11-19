import { buildRequesterUser } from '@tet/backend/users/models/auth.models';
import { failure, success } from '@tet/backend/utils/result.type';
import { createTrpcErrorHandler } from '@tet/backend/utils/trpc/trpc-error-handler';
import { DemarchePcaetStatusEnum } from '@tet/domain/demarches';
import { IndicateurPeriodiciteEnum } from '@tet/domain/indicateurs';
import { describe, expect, it, vi } from 'vitest';
import { updateDiagnosticIndicateursValeursErrorConfig } from './update-diagnostic-indicateurs-valeurs.errors';
import { UpdateDiagnosticIndicateursValeursService } from './update-diagnostic-indicateurs-valeurs.service';

const collectiviteId = 3;
const demarcheId = 7;
const indicateurId = 10;
const user = buildRequesterUser('00000000-0000-0000-0000-000000000001');
const tx = {
  select: () => ({ from: () => ({ where: async () => [] }) }),
};
const input = {
  collectiviteId,
  demarcheId,
  valeurs: [{ indicateurId, year: 2025, field: 'resultat', value: 12 }],
} as const;

const toServiceWithUpsertResult = (upsertResult: unknown) =>
  new UpdateDiagnosticIndicateursValeursService(
    { isAllowed: vi.fn().mockResolvedValue(success(true)) } as never,
    {} as never,
    {
      findRef: vi
        .fn()
        .mockResolvedValue({ status: DemarchePcaetStatusEnum.EN_ELABORATION }),
    } as never,
    { getOrCreateMetadonneeId: vi.fn().mockResolvedValue(5) } as never,
    {} as never,
    {
      upsertIndicateurValeurs: vi.fn().mockResolvedValue(upsertResult),
    } as never,
    {
      listIndicateursPredefinis: vi.fn().mockResolvedValue(
        success([
          {
            id: indicateurId,
            periodicite: IndicateurPeriodiciteEnum.ANNUELLE,
          },
        ])
      ),
    } as never,
    {} as never
  );

describe('UpdateDiagnosticIndicateursValeursService.updateValeurs', () => {
  const getResultDataOrThrow = createTrpcErrorHandler(
    updateDiagnosticIndicateursValeursErrorConfig
  );

  it.each([
    'INVALID_VALUE',
    'INDICATEUR_NOT_AVAILABLE',
    'PERIODICITE_MISMATCH',
    'USER_VALUE_NOT_ALLOWED',
  ] as const)(
    "un refus d'écriture %s remonte en BAD_REQUEST avec le message de la cause",
    async (error) => {
      const service = toServiceWithUpsertResult(
        failure(error, new Error('détail précis'))
      );

      const result = await service.updateValeurs(input as never, {
        user,
        tx: tx as never,
      });

      expect(() => getResultDataOrThrow(result)).toThrow(
        expect.objectContaining({
          code: 'BAD_REQUEST',
          message: 'détail précis',
        })
      );
    }
  );
});
