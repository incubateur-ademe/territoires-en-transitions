import { fireEvent, render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import type { IndicateurDefinition } from '@/app/indicateurs/indicateurs/use-get-indicateur';
import type { IndicateurChartInfo } from '../data/use-indicateur-chart';
import { IndicateurTable } from './indicateur-table';

vi.mock('@tet/ui', () => ({
  Button: ({
    children,
    onClick,
  }: {
    children: ReactNode;
    onClick: () => void;
  }) => (
    <button data-testid="open-editor" type="button" onClick={onClick}>
      {children}
    </button>
  ),
  ButtonGroup: ({
    activeButtonId,
    buttons,
  }: {
    activeButtonId: string;
    buttons: Array<{
      id: string;
      children: ReactNode;
      onClick: () => void;
    }>;
  }) => (
    <div data-testid="active-value-type" data-value={activeButtonId}>
      {buttons.map((button) => (
        <button key={button.id} type="button" onClick={button.onClick}>
          {button.children}
        </button>
      ))}
    </div>
  ),
}));

vi.mock('./edit-valeurs-modal', () => ({
  EditValeursModal: ({
    openState,
  }: {
    openState: { setIsOpen: (isOpen: boolean) => void };
  }) => (
    <button
      data-testid="close-editor"
      type="button"
      onClick={() => openState.setIsOpen(false)}
    />
  ),
}));

vi.mock('./indicateur-valeurs-table', () => ({
  IndicateurValeursTable: ({ type }: { type: string }) => (
    <div data-testid="rendered-value-type" data-value={type} />
  ),
}));

vi.mock('./private-mode-switch', () => ({
  PrivateModeSwitch: () => null,
}));

const definition = {
  id: 7,
  periodicite: 'annuelle',
} as IndicateurDefinition;

const makeChartInfo = (): IndicateurChartInfo =>
  ({
    isLoading: false,
    data: {
      valeurs: {
        resultats: { sources: [] },
        objectifs: { sources: [{}] },
      },
    },
    sourceFilter: { avecDonneesCollectivite: true },
  } as unknown as IndicateurChartInfo);

describe('IndicateurTable', () => {
  it("dérive l'onglet affiché des données sans effet de synchronisation", () => {
    render(
      <IndicateurTable
        chartInfo={makeChartInfo()}
        collectiviteId={42}
        definition={definition}
      />
    );

    expect(
      screen.getByTestId('active-value-type').getAttribute('data-value')
    ).toBe('objectif');
    expect(
      screen.getByTestId('rendered-value-type').getAttribute('data-value')
    ).toBe('objectif');
  });

  it("respecte l'état contrôlé de la modale et délègue sa fermeture", () => {
    const setIsOpen = vi.fn();
    const { rerender } = render(
      <IndicateurTable
        chartInfo={makeChartInfo()}
        collectiviteId={42}
        definition={definition}
        openModalState={{ isOpen: false, setIsOpen }}
      />
    );

    expect(screen.queryByTestId('close-editor')).toBeNull();

    rerender(
      <IndicateurTable
        chartInfo={makeChartInfo()}
        collectiviteId={42}
        definition={definition}
        openModalState={{ isOpen: true, setIsOpen }}
      />
    );
    fireEvent.click(screen.getByTestId('close-editor'));

    expect(setIsOpen).toHaveBeenCalledWith(false);
  });

  it("gère localement l'ouverture quand aucun état contrôlé n'est fourni", () => {
    render(
      <IndicateurTable
        chartInfo={makeChartInfo()}
        collectiviteId={42}
        definition={definition}
      />
    );

    fireEvent.click(screen.getByTestId('open-editor'));

    expect(screen.queryByTestId('close-editor')).not.toBeNull();
  });
});
