import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import {
  IndicateurMesuresLieesProvider,
  type MesuresLieesResult,
} from '../../context/indicateur-mesures-liees.context';
import { MesuresLieesListe } from './mesures-liees.list';

vi.mock('@/app/referentiels/actions/action.linked-card', () => ({
  default: ({ action }: { action: { actionId: string; nom: string } }) => (
    <div role="listitem">{action.nom}</div>
  ),
}));

const renderListe = ({
  result,
  mesuresIds = ['cae_1.a'],
}: {
  result: MesuresLieesResult;
  mesuresIds?: string[];
}) => {
  const useListMesuresLiees = vi.fn(() => result);
  render(
    <IndicateurMesuresLieesProvider value={{ useListMesuresLiees }}>
      <MesuresLieesListe mesuresIds={mesuresIds} isReadonly={false} />
    </IndicateurMesuresLieesProvider>
  );
  return { useListMesuresLiees };
};

const toMesures = (noms: string[]): MesuresLieesResult['mesures'] =>
  noms.map((nom) => ({ actionId: nom, nom })) as MesuresLieesResult['mesures'];

describe('MesuresLieesListe', () => {
  it('affiche une carte par mesure liée', () => {
    renderListe({
      result: {
        mesures: toMesures(['Mesure A', 'Mesure B']),
        isLoading: false,
      },
    });

    expect(
      screen.getAllByRole('listitem').map((card) => card.textContent)
    ).toEqual(['Mesure A', 'Mesure B']);
  });

  it('charge les mesures à partir des identifiants reçus', () => {
    const { useListMesuresLiees } = renderListe({
      result: { mesures: toMesures(['Mesure A']), isLoading: false },
      mesuresIds: ['cae_1.a', 'cae_2.b'],
    });

    expect(useListMesuresLiees).toHaveBeenCalledWith(['cae_1.a', 'cae_2.b']);
  });

  it("n'affiche rien tant que les mesures chargent", () => {
    renderListe({
      result: { mesures: toMesures(['Mesure A']), isLoading: true },
    });

    expect(screen.queryByRole('listitem')).toBeNull();
  });

  it("n'affiche rien quand aucune mesure n'est retrouvée", () => {
    renderListe({
      result: { mesures: [], isLoading: false },
    });

    expect(screen.queryByRole('listitem')).toBeNull();
  });
});
