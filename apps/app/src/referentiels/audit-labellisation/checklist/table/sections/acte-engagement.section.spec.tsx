import { ObjetPreuveEnum } from '@tet/domain/referentiels';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { appLabels } from '../../../../../labels/catalog';
import { ActePreuve, ActeEngagementSection } from './acte-engagement.section';

vi.mock('./upload-preuve-button', () => ({
  UploadPreuveButton: ({ label }: { label: string }) => (
    <button>{label}</button>
  ),
}));

vi.mock('./download-preuve-button', () => ({
  DownloadPreuveButton: () => <button>{'Télécharger le fichier'}</button>,
}));

const toActeDepose = (filename: string, id = 99): ActePreuve => ({
  id,
  objet: ObjetPreuveEnum.ACTE_ENGAGEMENT,
  fichier: { filename, hash: `hash-${id}`, bucket_id: 'bucket' },
});

describe("ActeEngagementSection — acte depose", () => {
  it("affiche l'acte déposé et le bouton « Remplacer » quand le dépôt est permis", () => {
    render(
      <ActeEngagementSection
        actes={[toActeDepose('acte-signe.pdf')]}
        isLoading={false}
        canUploadActe={true}
      />
    );

    expect(screen.getByText('acte-signe.pdf')).toBeDefined();
    expect(
      screen.getByRole('button', { name: appLabels.remplacerLeFichier })
    ).toBeDefined();
  });

  it("affiche l'acte déposé sans bouton « Remplacer » quand le dépôt est interdit", () => {
    render(
      <ActeEngagementSection
        actes={[toActeDepose('acte-signe.pdf')]}
        isLoading={false}
        canUploadActe={false}
      />
    );

    expect(screen.getByText('acte-signe.pdf')).toBeDefined();
    expect(
      screen.queryByRole('button', { name: appLabels.remplacerLeFichier })
    ).toBeNull();
  });

  it('affiche tous les documents rattachés à la section', () => {
    render(
      <ActeEngagementSection
        actes={[
          toActeDepose('acte-signe.pdf', 1),
          toActeDepose('annexe.pdf', 2),
        ]}
        isLoading={false}
        canUploadActe={true}
      />
    );

    expect(screen.getByText('acte-signe.pdf')).toBeDefined();
    expect(screen.getByText('annexe.pdf')).toBeDefined();
  });

  it('affiche le bouton « Télécharger » quel que soit le profil', () => {
    render(
      <ActeEngagementSection
        actes={[toActeDepose('acte-signe.pdf')]}
        isLoading={false}
        canUploadActe={false}
      />
    );

    expect(
      screen.getByRole('button', { name: appLabels.telechargerFichier })
    ).toBeDefined();
  });
});

describe('ActeEngagementSection — acte non depose', () => {
  it('affiche le bouton de téléversement quand le dépôt est permis', () => {
    render(
      <ActeEngagementSection
        actes={[]}
        isLoading={false}
        canUploadActe={true}
      />
    );

    expect(
      screen.getByRole('button', { name: appLabels.acteEngagementUploadButton })
    ).toBeDefined();
    expect(
      screen.queryByRole('button', { name: appLabels.telechargerFichier })
    ).toBeNull();
  });

  it('ne rend rien quand le dépôt est interdit', () => {
    const { container } = render(
      <ActeEngagementSection
        actes={[]}
        isLoading={false}
        canUploadActe={false}
      />
    );

    expect(container.firstChild).toBeNull();
  });
});

describe('ActeEngagementSection — chargement', () => {
  it("affiche l'état de chargement plutôt que le bouton de téléversement", () => {
    render(
      <ActeEngagementSection
        actes={[]}
        isLoading={true}
        canUploadActe={true}
      />
    );

    expect(screen.getByText(appLabels.chargement)).toBeDefined();
    expect(
      screen.queryByRole('button', { name: appLabels.acteEngagementUploadButton })
    ).toBeNull();
  });
});
