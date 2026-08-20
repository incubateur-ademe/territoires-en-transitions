import '@testing-library/jest-dom/vitest';

import { appLabels } from '@/app/labels/catalog';
import { toFileConstraints } from '@/app/referentiels/preuves/upload/constants';
import type { DemarcheDocumentAdditional } from '@tet/domain/demarches';
import { ChecklistTable } from '@tet/ui';
import { uiLabels } from '@tet/ui/labels/catalog';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { DemarcheDocumentAdditionalRow } from './document-additional.row';

const PDF_ONLY = toFileConstraints({
  additionalAmont: true,
  additionalAval: true,
  formatsAutorises: ['pdf'],
  mimeTypesAutorises: ['application/pdf'],
});

const documentAdditional = (
  overrides: Partial<DemarcheDocumentAdditional> = {}
): DemarcheDocumentAdditional => ({
  id: 42,
  etape: 'amont',
  titre: '',
  commentaire: '',
  modifiedAt: '2026-08-20T00:00:00Z',
  modifiedBy: null,
  fichier: null,
  ...overrides,
});

const renderRow = ({
  isJustCreated = false,
  isReadonly = false,
  ...overrides
}: Partial<DemarcheDocumentAdditional> & {
  isJustCreated?: boolean;
  isReadonly?: boolean;
} = {}) => {
  const onRename = vi.fn();
  const onRemove = vi.fn();
  render(
    <ChecklistTable hasTagColumn>
      <DemarcheDocumentAdditionalRow
        demarcheType="pcaet"
        fileConstraints={PDF_ONLY}
        documentAdditional={documentAdditional(overrides)}
        isReadonly={isReadonly}
        isJustCreated={isJustCreated}
        onRename={onRename}
        onAddFichier={vi.fn()}
        onRemove={onRemove}
      />
    </ChecklistTable>
  );
  return { onRename, onRemove };
};

const titreInput = () =>
  screen.getByRole('textbox', {
    name: appLabels.demarcheDocumentsAdditionalTitreLabel,
  });

/** Le retrait de la ligne est rangé derrière la flèche du bouton scindé. */
const openActionsMenu = () =>
  fireEvent.click(screen.getByRole('button', { name: uiLabels.autresActions }));

describe('DemarcheDocumentAdditionalRow — ouverture d’une pièce additionnelle', () => {
  it('ouvre le champ de nom, focus dedans, dès que la ligne vient d’être créée', () => {
    renderRow({ isJustCreated: true });

    const input = titreInput();
    expect(input).toBeInTheDocument();
    expect(input).toHaveFocus();
  });

  it('rend le dépôt disponible immédiatement, sans attendre de nom', () => {
    renderRow({ isJustCreated: true });

    const depot = screen.getByRole('button', {
      name: appLabels.demarcheDocumentsTeleverser,
    });
    expect(depot).toBeEnabled();
  });

  it('affiche l’absence de nom sur une ligne au repos', () => {
    renderRow();

    expect(
      screen.getByText(appLabels.demarcheDocumentsAdditionalSaisirNom)
    ).toBeInTheDocument();
    expect(screen.queryByRole('textbox')).toBeNull();
  });

  it('affiche le nom saisi sur une ligne au repos', () => {
    renderRow({ titre: 'Étude acoustique' });

    expect(screen.getByText('Étude acoustique')).toBeInTheDocument();
    expect(
      screen.queryByText(appLabels.demarcheDocumentsAdditionalSaisirNom)
    ).toBeNull();
  });
});

describe('DemarcheDocumentAdditionalRow — enregistrement du nom', () => {
  it('enregistre à la touche Entrée', () => {
    const { onRename } = renderRow({ isJustCreated: true });

    const input = titreInput();
    fireEvent.change(input, { target: { value: 'Concertation citoyenne' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(onRename).toHaveBeenCalledWith('Concertation citoyenne');
    // Le champ se referme sur le nom enregistré.
    expect(screen.queryByRole('textbox')).toBeNull();
  });

  it('n’a rien à valider : ni bouton d’enregistrement ni bouton d’abandon', () => {
    renderRow({ isJustCreated: true });

    // Le seul bouton de la ligne est le dépôt, et la flèche de ses actions.
    expect(screen.getAllByRole('button')).toHaveLength(2);
  });

  it('enregistre en quittant le champ, pour ne pas perdre la saisie', () => {
    const { onRename } = renderRow({ isJustCreated: true });

    const input = titreInput();
    fireEvent.change(input, { target: { value: 'Annexe locale' } });
    fireEvent.blur(input);

    expect(onRename).toHaveBeenCalledWith('Annexe locale');
  });

  it('coupe les espaces et n’enregistre pas un nom inchangé', () => {
    const { onRename } = renderRow({ isJustCreated: true, titre: 'Annexe' });

    const input = titreInput();
    fireEvent.change(input, { target: { value: '  Annexe  ' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(onRename).not.toHaveBeenCalled();
  });

  it('accepte un nom vidé : la pièce reprend son anonymat', () => {
    const { onRename } = renderRow({ isJustCreated: true, titre: 'Annexe' });

    fireEvent.change(titreInput(), { target: { value: '   ' } });
    fireEvent.keyDown(titreInput(), { key: 'Enter' });

    expect(onRename).toHaveBeenCalledWith('');
  });

  it('abandonne la saisie à Échap', () => {
    const { onRename } = renderRow({ isJustCreated: true });

    fireEvent.change(titreInput(), { target: { value: 'Abandonné' } });
    fireEvent.keyDown(titreInput(), { key: 'Escape' });

    expect(onRename).not.toHaveBeenCalled();
    expect(screen.queryByRole('textbox')).toBeNull();
  });

  it('referme le champ quand on retire la ligne en cours de saisie', () => {
    const { onRemove } = renderRow({ isJustCreated: true });

    fireEvent.change(titreInput(), { target: { value: 'Retirée aussitôt' } });
    openActionsMenu();
    fireEvent.click(
      screen.getByRole('button', {
        name: appLabels.demarcheDocumentsAdditionalSupprimer,
      })
    );

    expect(onRemove).toHaveBeenCalled();
    // La pièce qui portait le champ n'existe plus.
    expect(screen.queryByRole('textbox')).toBeNull();
  });

  it('ouvre le champ au clic sur le nom, sans bouton à découvrir au survol', () => {
    renderRow({ titre: 'Annexe' });

    expect(screen.queryByRole('textbox')).toBeNull();
    const nameButton = screen.getByRole('button', { name: 'Annexe' });
    expect(nameButton).toHaveClass('cursor-pointer');

    fireEvent.click(nameButton);
    expect(titreInput()).toHaveValue('Annexe');
  });

  it('ouvre le champ au clic sur la ligne encore sans nom', () => {
    renderRow();

    fireEvent.click(
      screen.getByRole('button', {
        name: appLabels.demarcheDocumentsAdditionalSaisirNom,
      })
    );
    expect(titreInput()).toHaveValue('');
  });

  it('ne propose ni saisie ni dépôt sur une étape gelée', () => {
    renderRow({ isJustCreated: true, isReadonly: true, titre: 'Annexe' });

    expect(screen.queryByRole('textbox')).toBeNull();
    expect(screen.queryAllByRole('button')).toHaveLength(0);
  });
});
