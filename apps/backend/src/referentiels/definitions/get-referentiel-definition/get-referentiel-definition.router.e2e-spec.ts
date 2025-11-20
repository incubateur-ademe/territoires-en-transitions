import { ReferentielId, ReferentielIdEnum } from '@tet/domain/referentiels';
import { inferProcedureInput } from '@trpc/server';
import { getTestRouter } from '../../../../test/app-utils';
import { getAnonUser } from '../../../../test/auth-utils';
import { AppRouter, TrpcRouter } from '../../../utils/trpc/trpc.router';

type GetReferentielDefinitionInput = inferProcedureInput<
  AppRouter['referentiels']['definitions']['get']
>;

describe('GetReferentielDefinitionRouter', () => {
  let router: TrpcRouter;

  beforeAll(async () => {
    router = await getTestRouter();
  });

  test('Get CAE referentiel definition (public access)', async () => {
    const caller = router.createCaller({ user: getAnonUser() });

    const input: GetReferentielDefinitionInput = {
      referentielId: ReferentielIdEnum.CAE,
    };

    const result = await caller.referentiels.definitions.get(input);

    expect(result).toMatchObject({
      id: ReferentielIdEnum.CAE,
      nom: expect.any(String),
      version: expect.any(String),
      hierarchie: expect.any(Array),
      modifiedAt: expect.any(String),
    });
  });

  test('Invalid referentiel ID throws error', async () => {
    const caller = router.createCaller({ user: getAnonUser() });

    const input = {
      referentielId: 'invalid_referentiel' as ReferentielId,
    };

    await expect(
      caller.referentiels.definitions.get(input)
    ).rejects.toThrowError();
  });
});
