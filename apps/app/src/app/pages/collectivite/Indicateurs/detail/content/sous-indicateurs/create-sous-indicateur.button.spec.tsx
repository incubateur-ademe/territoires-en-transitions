import { appLabels } from '@/app/labels/catalog';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import {
  IndicateurSousIndicateursTableProvider,
  type IndicateurSousIndicateursTableValue,
} from '../../context/indicateur-sous-indicateurs-table.context';
import { CreateSousIndicateurButton } from './create-sous-indicateur.button';

const renderButton = ({ childCount }: { childCount: number }) => {
  const createSousIndicateur = vi.fn();
  const value = {
    useCreateSousIndicateur: () => createSousIndicateur,
  } as unknown as IndicateurSousIndicateursTableValue;

  render(
    <IndicateurSousIndicateursTableProvider value={value}>
      <CreateSousIndicateurButton parentId={7} childCount={childCount} />
    </IndicateurSousIndicateursTableProvider>
  );
  fireEvent.click(
    screen.getByRole('button', {
      name: appLabels.indicateurCreerSousIndicateur,
    })
  );
  return createSousIndicateur;
};

describe('CreateSousIndicateurButton', () => {
  it('crée deux sous-indicateurs d’un coup quand le parent n’en a aucun', () => {
    const createSousIndicateur = renderButton({ childCount: 0 });

    expect(createSousIndicateur).toHaveBeenCalledWith(
      {
        parentId: 7,
        titre: appLabels.indicateurSousIndicateurNomProvisoire({ numero: 1 }),
        titreSecondSousIndicateur:
          appLabels.indicateurSousIndicateurNomProvisoire({ numero: 2 }),
      },
      undefined
    );
  });

  it('ajoute un seul sous-indicateur quand le parent en a déjà deux', () => {
    const createSousIndicateur = renderButton({ childCount: 2 });

    expect(createSousIndicateur).toHaveBeenCalledWith(
      {
        parentId: 7,
        titre: appLabels.indicateurSousIndicateurNomProvisoire({ numero: 3 }),
      },
      undefined
    );
  });
});
