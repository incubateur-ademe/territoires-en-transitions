import type { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { failure, success } from '@tet/backend/utils/result.type';
import { toIndicateurRow } from '../../indicateur/indicateur-row.test-fixture';
import { LoadIndicateurCalculGraphService } from './load-indicateur-calcul-graph.service';

const cause = new Error(
  'Indicateur 9 : nature incohérente (PERSO_WITH_GROUPEMENT)'
);
const natureFailure = failure('DATABASE_ERROR', cause);
const graphFailure = failure('LOAD_CALCUL_GRAPH_FAILED', cause);
const context = { tx: {} as Transaction };
const predefini = toIndicateurRow({ id: 1, identifiantReferentiel: 'cae_1.a' });

const makeService = ({
  listIndicateursPredefinis = vi.fn(),
  listIndicateursPredefinisHavingComputedValue = vi.fn(),
  lockIndicateurs = vi.fn(),
}) =>
  new LoadIndicateurCalculGraphService(
    {
      listIndicateursPredefinis,
      listIndicateursPredefinisHavingComputedValue,
    } as never,
    { lockForValueWrite: vi.fn(), lockIndicateurs } as never,
    { extractNeededSourceIndicateursFromFormula: vi.fn(() => []) } as never
  );

describe('LoadIndicateurCalculGraphService', () => {
  it('requalifie l’échec de lecture des formules avec sa cause', async () => {
    const service = makeService({
      listIndicateursPredefinisHavingComputedValue: vi
        .fn()
        .mockResolvedValue(natureFailure),
    });

    await expect(service.loadAllComputedIndicateurs()).resolves.toEqual(
      graphFailure
    );
  });

  it('requalifie l’échec de lecture des sources d’un recalcul', async () => {
    const service = makeService({
      listIndicateursPredefinis: vi.fn().mockResolvedValue(natureFailure),
    });

    await expect(service.loadForRecompute([1], context)).resolves.toEqual(
      graphFailure
    );
  });

  it('requalifie l’échec de lecture des sources modifiées', async () => {
    const service = makeService({
      listIndicateursPredefinis: vi.fn().mockResolvedValue(natureFailure),
    });

    await expect(service.loadDependants([1], context)).resolves.toEqual(
      graphFailure
    );
  });

  it('requalifie l’échec de lecture des formules dépendantes', async () => {
    const service = makeService({
      listIndicateursPredefinis: vi
        .fn()
        .mockResolvedValue(success([predefini])),
      listIndicateursPredefinisHavingComputedValue: vi
        .fn()
        .mockResolvedValue(natureFailure),
    });

    await expect(service.loadDependants([1], context)).resolves.toEqual(
      graphFailure
    );
  });

  it('requalifie l’échec du verrouillage des définitions', async () => {
    const service = makeService({
      listIndicateursPredefinis: vi
        .fn()
        .mockResolvedValue(success([predefini])),
      lockIndicateurs: vi.fn().mockResolvedValue(natureFailure),
    });

    await expect(service.loadForRecompute([1], context)).resolves.toEqual(
      graphFailure
    );
  });

  it('rend le graphe verrouillé quand tout est cohérent', async () => {
    const service = makeService({
      listIndicateursPredefinis: vi
        .fn()
        .mockResolvedValue(success([predefini])),
      lockIndicateurs: vi.fn().mockResolvedValue(success([predefini])),
    });

    await expect(service.loadForRecompute([1], context)).resolves.toEqual(
      success({
        formulas: [],
        sourceDefinitions: [predefini],
        targetDefinitions: [predefini],
      })
    );
  });
});
