import { ParcoursLabellisation } from '@tet/domain/referentiels';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import {
  TCycleLabellisation,
  useCycleLabellisation,
} from '../../labellisations/useCycleLabellisation';
import { ScoreRempli } from './Scores';

vi.mock('../../labellisations/useCycleLabellisation', () => ({
  useCycleLabellisation: vi.fn(),
}));

vi.mock('next/image', () => ({
  default: () => null,
}));

const mockedUseCycleLabellisation = vi.mocked(useCycleLabellisation);

const toCycleLabellisation = (
  parcours: ParcoursLabellisation | null
): TCycleLabellisation => ({
  parcours,
  isLoading: false,
  isError: false,
  status: 'non_demandee',
  isAuditeur: false,
  isConductingAudit: false,
  viewerRole: 'other',
  isCOT: false,
  labellisable: false,
  maximumRequestableStar: null,
  peutDemanderEtoile: false,
  canStartAudit: false,
  peutDemander1ereEtoileCOT: false,
  canAskFirstStar: false,
});

describe('ScoreRempli', () => {
  it('renvoie vers audit-labellisation et non vers la page labellisation historique', () => {
    mockedUseCycleLabellisation.mockReturnValue(toCycleLabellisation(null));

    render(
      <ScoreRempli
        isReadonly
        collectiviteId={4322}
        referentiel="cae"
        title="Climat Air Énergie"
        axes={[]}
        potentiel={undefined}
      />
    );

    expect(
      screen
        .getByRole('link', { name: /Suivre la labellisation/ })
        .getAttribute('href')
    ).toBe('/collectivite/4322/referentiel/cae/audit-labellisation');
  });
});
