import {
  SidePanelProvider,
  useSidePanel,
} from '@/app/ui/layout/side-panel/side-panel.context';
import { act, renderHook } from '@testing-library/react';
import { isValidElement, ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { Preselection } from '../../use-preselection';
import {
  LevierPriorisation,
  NO_MOBILISATION,
} from '../data/to-leviers-priorisation';
import { LevierPlace } from '../data/to-matrix-points';
import { useLevierSidePanel } from './use-levier-side-panel';

vi.mock('next/navigation', () => ({ usePathname: () => '/' }));

vi.mock('./levier.panel', () => ({ LevierPanel: () => null }));

const COVOITURAGE: LevierPriorisation = {
  levierId: 'covoiturage',
  nom: 'Covoiturage',
  secteur: 'Transports',
  ficheCount: 0,
  mobilisationScore: 0,
  noteByCategorie: NO_MOBILISATION,
};

const COVOITURAGE_NON_PERTINENT: LevierPriorisation = {
  ...COVOITURAGE,
  pertinence: 'non_pertinent',
};

const EMPTY_PRESELECTION: Preselection = {
  isReady: true,
  actions: [],
  statusOf: () => 'disponible',
  addedToPlanOf: () => undefined,
  add: vi.fn(),
  remove: vi.fn(),
  ignore: vi.fn(),
  restore: vi.fn(),
  markAddedToPlan: vi.fn(),
  clearAddedToPlan: vi.fn(),
};

const SidePanelWrapper = ({ children }: { children: ReactNode }) => (
  <SidePanelProvider>{children}</SidePanelProvider>
);

const renderLevierSidePanel = (places: LevierPlace[] = []) =>
  renderHook(
    () => ({
      levierSidePanel: useLevierSidePanel({
        leviers: [COVOITURAGE],
        places,
        preselection: EMPTY_PRESELECTION,
      }),
      panelContent: useSidePanel().panel.content,
      panelHeaderExtra: useSidePanel().panel.headerExtra,
      isPanelOpen: useSidePanel().panel.isOpen,
    }),
    { wrapper: SidePanelWrapper }
  );

const toContentKey = (content: ReactNode): string | null | undefined =>
  isValidElement(content) ? content.key : undefined;

describe('useLevierSidePanel', () => {
  it('un nouveau clic sur la même case remonte le volet, pour réappliquer sa catégorie', () => {
    const { result } = renderLevierSidePanel();

    act(() =>
      result.current.levierSidePanel.select('covoiturage', 'financement')
    );
    const firstKey = toContentKey(result.current.panelContent);
    act(() =>
      result.current.levierSidePanel.select('covoiturage', 'financement')
    );
    const secondKey = toContentKey(result.current.panelContent);

    expect(firstKey).toBeDefined();
    expect(secondKey).not.toBe(firstKey);
  });

  it("l'en-tête du volet porte le secteur et l'impact potentiel estimé du levier sélectionné", () => {
    const { result } = renderLevierSidePanel([
      {
        ...COVOITURAGE,
        potentielReduction: 10,
        potentielScore: 50,
        impactIndex: 19,
        impactIndexByCategorie: new Map(),
      },
    ]);

    act(() => result.current.levierSidePanel.select('covoiturage'));

    expect(isValidElement(result.current.panelHeaderExtra)).toBe(true);
    expect(
      isValidElement(result.current.panelHeaderExtra) &&
        result.current.panelHeaderExtra.props
    ).toMatchObject({
      levier: { nom: 'Covoiturage' },
      subtitle: 'Transports · Impact potentiel estimé : 19/100',
    });
  });

  it("l'en-tête du volet termine par la pertinence enregistrée du levier sélectionné", () => {
    const { result } = renderHook(
      () => ({
        levierSidePanel: useLevierSidePanel({
          leviers: [COVOITURAGE_NON_PERTINENT],
          places: [],
          preselection: EMPTY_PRESELECTION,
        }),
        panelHeaderExtra: useSidePanel().panel.headerExtra,
      }),
      { wrapper: SidePanelWrapper }
    );

    act(() => result.current.levierSidePanel.select('covoiturage'));

    expect(
      isValidElement(result.current.panelHeaderExtra) &&
        result.current.panelHeaderExtra.props
    ).toMatchObject({ subtitle: 'Transports · Non pertinent' });
  });

  it('referme le volet ouvert et oublie le levier sélectionné', () => {
    const { result } = renderLevierSidePanel();
    act(() => result.current.levierSidePanel.select('covoiturage'));
    const whileOpen = {
      isPanelOpen: result.current.isPanelOpen,
      selectedLevierId: result.current.levierSidePanel.selectedLevierId,
    };

    act(() => result.current.levierSidePanel.close());

    expect({
      whileOpen,
      afterClose: {
        isPanelOpen: result.current.isPanelOpen,
        selectedLevierId: result.current.levierSidePanel.selectedLevierId,
      },
    }).toEqual({
      whileOpen: { isPanelOpen: true, selectedLevierId: 'covoiturage' },
      afterClose: { isPanelOpen: false, selectedLevierId: undefined },
    });
  });
});
