import { Etoile, EtoileEnum, SujetDemandeEnum } from '@tet/domain/referentiels';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Parcours } from '../checklist-view-model';
import { ChecklistContextValue, useChecklist } from '../checklist.context';
import { EMPTY_CYCLE } from '../checklist.test-fixture';
import { ChecklistView } from './index';

vi.mock('@tet/api/collectivites', () => ({
  useCollectiviteId: () => 1,
}));

vi.mock(
  '@/app/referentiels/referentiel-context',
  (): Partial<
    Record<
      keyof typeof import('@/app/referentiels/referentiel-context'),
      unknown
    >
  > => ({
    useGetReferentielDefinitionFromContext: () => null,
  })
);

vi.mock(
  '../checklist.context',
  (): Partial<
    Record<keyof typeof import('../checklist.context'), unknown>
  > => ({
    useChecklist: vi.fn(),
  })
);

vi.mock(
  './checklist-actions',
  (): Partial<Record<keyof typeof import('./checklist-actions'), unknown>> => ({
    ChecklistActions: () => null,
  })
);

vi.mock(
  './table/labellisation-checklist.table',
  (): Partial<
    Record<
      keyof typeof import('./table/labellisation-checklist.table'),
      unknown
    >
  > => ({
    LabellisationChecklistTable: () => null,
  })
);

const mockedUseChecklist = vi.mocked(useChecklist);

const avecLabellisation = 'Avec labellisation';

const toParcours = (etoileObjectif: Etoile): Parcours => ({
  etoileObjectif,
  completude: { done: false },
  minimumScore: null,
  scoreFait: 0,
  mesures: [],
  roleMesures: { eluReferent: null, referentTechnique: null },
  acteEngagement: { demandeId: null },
});

const renderChecklistView = ({
  isCOT,
  etoileObjectif,
}: {
  isCOT: boolean;
  etoileObjectif: Etoile;
}): void => {
  const checklist: ChecklistContextValue = {
    cycle: { ...EMPTY_CYCLE, isCOT },
    parcours: toParcours(etoileObjectif),
    referentielId: 'cae',
    showActeEngagement: false,
    showCandidatureDocuments: false,
    canUpdateCandidatureDocuments: false,
    sujetVise: isCOT
      ? SujetDemandeEnum.LABELLISATION_COT
      : SujetDemandeEnum.LABELLISATION,
    sujetCotVise: SujetDemandeEnum.LABELLISATION_COT,
    selectEtoileVisee: vi.fn(),
    selectSujetCotVise: vi.fn(),
  };
  mockedUseChecklist.mockReturnValue(checklist);
  render(<ChecklistView viewModel={toParcours(etoileObjectif)} />);
};

describe('ChecklistView', () => {
  it("propose l'audit COT seul à une collectivité COT sans étoile, présélectionnée sur la première étoile", () => {
    renderChecklistView({
      isCOT: true,
      etoileObjectif: EtoileEnum.PREMIERE_ETOILE,
    });

    expect(
      screen.getByRole('checkbox', { name: avecLabellisation })
    ).toHaveProperty('checked', true);
  });

  it("propose l'audit COT seul à une collectivité COT qui vise la deuxième étoile", () => {
    renderChecklistView({
      isCOT: true,
      etoileObjectif: EtoileEnum.DEUXIEME_ETOILE,
    });

    expect(
      screen.getByRole('checkbox', { name: avecLabellisation })
    ).toHaveProperty('checked', true);
  });

  it("ne propose pas l'audit COT seul à une collectivité hors COT", () => {
    renderChecklistView({
      isCOT: false,
      etoileObjectif: EtoileEnum.DEUXIEME_ETOILE,
    });

    expect(
      screen.queryByRole('checkbox', { name: avecLabellisation })
    ).toBeNull();
  });
});
