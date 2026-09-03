import { useCurrentCollectivite } from '@tet/api/collectivites';
import { useUser } from '@tet/api/users';
import { EtoileEnum } from '@tet/domain/referentiels';
import { fireEvent, render, screen } from '@testing-library/react';
import { ReactElement, ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Parcours } from '../../checklist-view-model';
import { useChecklist, useRoleDropdown } from '../../checklist.context';
import { LabellisationChecklistTable } from './labellisation-checklist.table';

vi.mock('../../checklist.context', () => ({
  useChecklist: vi.fn(),
  useRoleDropdown: vi.fn(),
}));

vi.mock('@tet/api/collectivites', () => ({
  useCurrentCollectivite: vi.fn(),
}));

vi.mock('@tet/api/users', () => ({
  useUser: vi.fn(),
}));

const voirLesMesures = 'Voir les mesures';

const userId = 'e2b9c0a4-0000-4000-8000-000000000000';
const storageKey = `tet_referentiel_table_columns_visibility_${userId}`;

const UnnavigableLinks = ({
  children,
}: {
  children: ReactNode;
}): ReactElement => (
  <div onClickCapture={(event) => event.preventDefault()}>{children}</div>
);

const emptyParcours: Parcours = {
  etoileObjectif: EtoileEnum.PREMIERE_ETOILE,
  completude: { done: false },
  minimumScore: { done: false, seuilPercent: 35 },
  scoreFait: 0,
  mesures: [],
  roleMesures: { eluReferent: null, referentTechnique: null },
  acteEngagement: { demandeId: null },
};

describe('LabellisationChecklistTable', () => {
  beforeEach(() => {
    vi.mocked(useChecklist).mockReturnValue({
      showActeEngagement: false,
      showCandidatureDocuments: false,
    } as ReturnType<typeof useChecklist>);
    vi.mocked(useRoleDropdown).mockReturnValue({
      activeActionId: null,
      openDropdown: vi.fn(),
      closeDropdown: vi.fn(),
    });
    vi.mocked(useCurrentCollectivite).mockReturnValue({
      hasReferentielPermission: () => true,
    } as unknown as ReturnType<typeof useCurrentCollectivite>);
    vi.mocked(useUser).mockReturnValue({ id: userId } as ReturnType<
      typeof useUser
    >);
    window.localStorage.clear();
  });

  const renderChecklist = (): void => {
    render(
      <UnnavigableLinks>
        <LabellisationChecklistTable
          viewModel={emptyParcours}
          collectiviteId={4172}
          referentielId="eci"
        />
      </UnnavigableLinks>
    );
  };

  it('renvoie vers les mesures filtrées sur le statut non renseigné', () => {
    renderChecklist();

    expect(
      screen.getByRole('link', { name: voirLesMesures }).getAttribute('href')
    ).toBe('/collectivite/4172/referentiel/eci/progression?s=non_renseigne');
  });

  it("réaffiche la colonne statut que l'utilisateur avait masquée", () => {
    window.localStorage.setItem(storageKey, JSON.stringify({ statut: false }));
    renderChecklist();

    fireEvent.click(screen.getByRole('link', { name: voirLesMesures }));

    expect(JSON.parse(window.localStorage.getItem(storageKey) ?? '{}')).toEqual(
      {
        statut: true,
      }
    );
  });
});
