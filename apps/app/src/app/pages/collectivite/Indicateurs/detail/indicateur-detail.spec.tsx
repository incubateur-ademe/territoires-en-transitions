import { INDICATEUR_TRAJECTOIRE_IDENTFIANTS } from '@/app/indicateurs/trajectoires/trajectoire-constants';
import { render } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { IndicateurDetail } from './IndicateurDetail';

const mocks = vi.hoisted(() => ({
  snbc3Enabled: undefined as boolean | undefined,
  indicateur: undefined as unknown,
  statut: undefined as { status: string } | undefined,
  useGetStatutTrajectoire: vi.fn(),
  useGetTrajectoire: vi.fn(),
}));

vi.mock('@tet/api/collectivites', () => ({
  useCollectiviteId: (): number => 1,
}));
vi.mock('@/app/indicateurs/indicateurs/use-get-indicateur', () => ({
  useGetIndicateur: () => ({ data: mocks.indicateur, isLoading: false }),
}));
vi.mock(
  '../../Trajectoire/trajectoire-snbc3/data/use-is-trajectoire-snbc3-enabled',
  () => ({ useIsTrajectoireSnbc3Enabled: () => mocks.snbc3Enabled })
);
vi.mock('../../Trajectoire/use-get-statut-trajectoire', () => ({
  useGetStatutTrajectoire: (enabled: boolean) => {
    mocks.useGetStatutTrajectoire(enabled);
    return { data: enabled ? mocks.statut : undefined };
  },
}));
vi.mock('../../Trajectoire/use-trajectoire', () => ({
  useGetTrajectoire: (args: { enabled: boolean }) =>
    mocks.useGetTrajectoire(args),
}));
vi.mock('./IndicateurLayout', () => ({ default: () => null }));

const indicateurTrajectoire = {
  id: 1,
  collectiviteId: null,
  identifiantReferentiel: INDICATEUR_TRAJECTOIRE_IDENTFIANTS[0],
};

const lastCall = (fn: ReturnType<typeof vi.fn>) => fn.mock.calls.at(-1)?.[0];

describe('IndicateurDetail : calcul de la trajectoire SNBC 2', () => {
  beforeEach(() => {
    mocks.useGetStatutTrajectoire.mockClear();
    mocks.useGetTrajectoire.mockClear();
    mocks.indicateur = indicateurTrajectoire;
    mocks.statut = { status: 'pret_a_calculer' };
  });

  it('flag pas encore connu : ni statut ni calcul', () => {
    mocks.snbc3Enabled = undefined;
    render(<IndicateurDetail indicateurId={1} />);
    expect(lastCall(mocks.useGetStatutTrajectoire)).toBe(false);
    expect(lastCall(mocks.useGetTrajectoire)).toEqual({ enabled: false });
  });

  it('flag SNBC 3 actif : ni statut ni calcul', () => {
    mocks.snbc3Enabled = true;
    render(<IndicateurDetail indicateurId={1} />);
    expect(lastCall(mocks.useGetStatutTrajectoire)).toBe(false);
    expect(lastCall(mocks.useGetTrajectoire)).toEqual({ enabled: false });
  });

  it('sans le flag : statut demandé et calcul lancé si prêt à calculer', () => {
    mocks.snbc3Enabled = false;
    render(<IndicateurDetail indicateurId={1} />);
    expect(lastCall(mocks.useGetStatutTrajectoire)).toBe(true);
    expect(lastCall(mocks.useGetTrajectoire)).toEqual({ enabled: true });
  });

  it('sans le flag, indicateur hors trajectoire : ni statut ni calcul', () => {
    mocks.snbc3Enabled = false;
    mocks.indicateur = {
      ...indicateurTrajectoire,
      identifiantReferentiel: 'eci_1',
    };
    render(<IndicateurDetail indicateurId={1} />);
    expect(lastCall(mocks.useGetStatutTrajectoire)).toBe(false);
    expect(lastCall(mocks.useGetTrajectoire)).toEqual({ enabled: false });
  });
});
