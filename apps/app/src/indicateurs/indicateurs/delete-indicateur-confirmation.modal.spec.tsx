import { appLabels } from '@/app/labels/catalog';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { DeleteIndicateurConfirmationModal } from './delete-indicateur-confirmation.modal';

const renderModal = ({ enfantsCount }: { enfantsCount: number }) => {
  const onConfirm = vi.fn();
  render(
    <DeleteIndicateurConfirmationModal
      titre="Déchets"
      enfantsCount={enfantsCount}
      openState={{ isOpen: true, setIsOpen: vi.fn() }}
      onConfirm={onConfirm}
    />
  );
  return { onConfirm };
};

describe('DeleteIndicateurConfirmationModal', () => {
  it('garde la description habituelle pour un indicateur sans sous-indicateur', () => {
    renderModal({ enfantsCount: 0 });

    expect(
      screen.getByText(appLabels.suppressionIndicateurDescription)
    ).toBeDefined();
    expect(
      screen.queryByText(appLabels.indicateurSuppressionParentTitre)
    ).toBeNull();
  });

  it('prévient que les sous-indicateurs deviennent indépendants, avec leur nombre, quand il y en a plusieurs', () => {
    renderModal({ enfantsCount: 2 });

    expect(
      screen.getByText(appLabels.indicateurSuppressionParentTitre)
    ).toBeDefined();
    expect(
      screen.getByText(
        'Ses 2 sous-indicateurs ne seront pas supprimés : ils deviennent des indicateurs indépendants, avec leurs données.'
      )
    ).toBeDefined();
    expect(
      screen.queryByText(appLabels.suppressionIndicateurDescription)
    ).toBeNull();
  });

  it('accorde le message au singulier pour un seul sous-indicateur', () => {
    renderModal({ enfantsCount: 1 });

    expect(
      screen.getByText(
        'Son sous-indicateur ne sera pas supprimé : il devient un indicateur indépendant, avec ses données.'
      )
    ).toBeDefined();
  });

  it('supprime à la confirmation seulement', () => {
    const { onConfirm } = renderModal({ enfantsCount: 2 });

    expect(onConfirm).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: appLabels.supprimer }));

    expect(onConfirm).toHaveBeenCalledTimes(1);
  });
});
