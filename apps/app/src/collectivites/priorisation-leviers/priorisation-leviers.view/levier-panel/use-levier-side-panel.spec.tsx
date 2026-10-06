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

const renderLevierSidePanel = () =>
  renderHook(
    () => ({
      levierSidePanel: useLevierSidePanel({
        leviers: [COVOITURAGE],
        preselection: EMPTY_PRESELECTION,
      }),
      panelContent: useSidePanel().panel.content,
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
});
