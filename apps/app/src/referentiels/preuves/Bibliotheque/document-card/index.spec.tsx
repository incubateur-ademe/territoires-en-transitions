import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';
import { DocumentCard } from '.';
import {
  preuveComplementaireFichier,
  preuveComplementaireLien,
  preuveReglementaireFichier,
  preuveReglementaireLien,
  preuveReglementaireNonRenseignee,
} from '../documents.fixture';
import { DocumentReglementaire, PreuveAudit, PreuveRapport } from '../types';

vi.mock('../use-open-preuve', () => ({
  useOpenPreuve: () => vi.fn(),
}));

const toMutation = () => ({ mutate: vi.fn(), isPending: false });

vi.mock('../use-edit-preuve', () => ({
  useRemovePreuve: () => toMutation(),
  useUpdatePreuveCommentaire: () => toMutation(),
  useUpdatePreuveLien: () => toMutation(),
  useUpdateBibliothequeFichier: () => toMutation(),
}));

vi.mock('@/app/referentiels/preuves/AddPreuveModal', () => ({
  AddPreuveModal: () => null,
}));

const mutationActions = (
  <DocumentCard.Actions>
    <DocumentCard.Edit />
    <DocumentCard.Comment />
    <DocumentCard.Delete />
  </DocumentCard.Actions>
);

const fichierConfidentiel: DocumentReglementaire = {
  preuveType: 'reglementaire',
  id: 2,
  collectiviteId: 1,
  lien: null,
  fichier: {
    id: 21,
    hash: 'c9df071601f3f72b5430a55cd7ea584be5c2a36bb4226b621c4dca50088ef8b9',
    filename: 'preuve_input.txt',
    filesize: 34,
    bucketId: '9d4ccd86-268b-4292-aeda-18bfbe6496df',
    confidentiel: true,
  },
  commentaire: 'commentaire preuve fichier',
  modifiedAt: '2022-09-06T16:43:41.423515+00:00',
  modifiedBy: '17440546-f389-4d4f-bfdb-b0c94a1bd0f9',
  modifiedByNom: 'Yolo Dodo',
  action: { actionId: 'eci_1.1.3', identifiant: '1.1.3' },
  preuveReglementaire: {
    id: 'etude_vulnerabilite',
    nom: 'Etude de vulnerabilite',
    description: '',
  },
};

const COMMENTAIRE_LONG =
  'Ce commentaire depasse cent soixante caracteres. '.repeat(5);

const documentAudit: PreuveAudit = {
  preuveType: 'audit',
  id: 5,
  collectiviteId: 1,
  fichier: {
    id: 22,
    hash: 'a1b2c3',
    filename: 'rapport-audit.pdf',
    filesize: 1024,
    bucketId: '9d4ccd86-268b-4292-aeda-18bfbe6496df',
    confidentiel: false,
  },
  lien: null,
  commentaire: '',
  modifiedAt: '2022-09-06T16:43:41.423515+00:00',
  modifiedBy: '17440546-f389-4d4f-bfdb-b0c94a1bd0f9',
  modifiedByNom: 'Yolo Dodo',
  demande: null,
  audit: {
    id: 1,
    collectiviteId: 1,
    demandeId: null,
    dateDebut: '2022-09-01T00:00:00+00:00',
    dateFin: null,
    clos: false,
    valide: false,
    referentielId: 'eci',
  },
};

const documentRapport: PreuveRapport = {
  preuveType: 'rapport',
  id: 6,
  collectiviteId: 1,
  fichier: {
    id: 23,
    hash: 'd4e5f6',
    filename: 'visite-annuelle.pdf',
    filesize: 2048,
    bucketId: '9d4ccd86-268b-4292-aeda-18bfbe6496df',
    confidentiel: false,
  },
  lien: null,
  commentaire: '',
  modifiedAt: '2022-09-06T16:43:41.423515+00:00',
  modifiedBy: '17440546-f389-4d4f-bfdb-b0c94a1bd0f9',
  modifiedByNom: 'Yolo Dodo',
  rapport: { date: '2022-06-15' },
};

describe('DocumentCard', () => {
  test('rend un document de type fichier', () => {
    const { container } = render(
      <DocumentCard document={preuveReglementaireFichier}>
        {mutationActions}
      </DocumentCard>
    );

    expect(container.innerHTML).toMatchSnapshot();
  });

  test('rend un document de type lien', () => {
    const { container } = render(
      <DocumentCard document={preuveReglementaireLien}>
        {mutationActions}
      </DocumentCard>
    );

    expect(container.innerHTML).toMatchSnapshot();
  });

  test('signale un fichier confidentiel par un cadenas', () => {
    const { container } = render(
      <DocumentCard document={fichierConfidentiel}>
        {mutationActions}
      </DocumentCard>
    );

    expect(
      container.querySelector('[data-test="carte-doc-confidentiel"]')
    ).toBeTruthy();
    expect(container.innerHTML).toMatchSnapshot();
  });

  test('ne rend rien pour un attendu sans depot', () => {
    const { container } = render(
      <DocumentCard document={preuveReglementaireNonRenseignee}>
        {mutationActions}
      </DocumentCard>
    );

    expect(container.innerHTML).toBe('');
  });

  test('rend un document sans menu quand aucune action n est declaree', () => {
    const { container } = render(
      <DocumentCard document={preuveReglementaireFichier} />
    );

    expect(container.querySelector('button')).toBeNull();
    expect(container.innerHTML).toMatchSnapshot();
  });

  test("affiche l'identifiant de la mesure quand il est demande", () => {
    const { container } = render(
      <DocumentCard document={preuveComplementaireFichier}>
        <DocumentCard.Identifier
          value={preuveComplementaireFichier.action.identifiant}
        />
        {mutationActions}
      </DocumentCard>
    );

    expect(container.innerHTML).toMatchSnapshot();
  });

  test('signale un document deja present dans la bibliotheque', () => {
    const { container } = render(
      <DocumentCard document={preuveReglementaireFichier}>
        <DocumentCard.Duplicate information={{ storedFilenameKept: true }} />
        {mutationActions}
      </DocumentCard>
    );

    expect(container.innerHTML).toMatchSnapshot();
  });

  test('ne rend aucun bloc commentaire quand le document n en porte pas', () => {
    const { container } = render(
      <DocumentCard document={preuveComplementaireLien}>
        {mutationActions}
      </DocumentCard>
    );

    expect(container.querySelector('[data-test="comment"]')).toBeNull();
    expect(container.innerHTML).toMatchSnapshot();
  });

  test('tronque un commentaire de plus de 160 caracteres et offre de le deplier', () => {
    const { container } = render(
      <DocumentCard
        document={{
          ...preuveComplementaireFichier,
          commentaire: COMMENTAIRE_LONG,
        }}
      >
        {mutationActions}
      </DocumentCard>
    );

    expect(screen.getByRole('button', { name: 'Voir plus' })).toBeTruthy();
    expect(container.innerHTML).toMatchSnapshot();
  });

  test('garde le commentaire deplie quand un enfant apparait', () => {
    const document = {
      ...preuveComplementaireFichier,
      commentaire: COMMENTAIRE_LONG,
    };
    const { container, rerender } = render(
      <DocumentCard document={document}>{mutationActions}</DocumentCard>
    );
    fireEvent.click(screen.getByRole('button', { name: 'Voir plus' }));

    rerender(
      <DocumentCard document={document}>
        <DocumentCard.Identifier value="1.1.3" />
        {mutationActions}
      </DocumentCard>
    );

    expect(container.querySelector('[data-test="comment"]')?.textContent).toBe(
      COMMENTAIRE_LONG
    );
  });

  test('remplace le commentaire par sa saisie et masque le menu pendant l edition', () => {
    const { container } = render(
      <DocumentCard document={preuveComplementaireFichier}>
        {mutationActions}
      </DocumentCard>
    );

    fireEvent.click(screen.getByRole('button', { name: 'Commenter' }));

    expect(
      screen.queryByRole('button', { name: 'Éditer le document' })
    ).toBeNull();
    expect(container.querySelector('textarea')).toBeTruthy();
    expect(container.innerHTML).toMatchSnapshot();
  });

  test("un rapport d'audit porte le remplacement de fichier et pas la suppression", () => {
    const { container } = render(
      <DocumentCard document={documentAudit}>
        <DocumentCard.Actions>
          <DocumentCard.Edit />
          <DocumentCard.Comment />
          <DocumentCard.Replace onReplace={vi.fn()} />
        </DocumentCard.Actions>
      </DocumentCard>
    );

    expect(
      screen.getByRole('button', { name: 'Remplacer le fichier' })
    ).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Supprimer' })).toBeNull();
    expect(container.innerHTML).toMatchSnapshot();
  });

  test('un rapport de visite affiche la date de visite', () => {
    const { container } = render(
      <DocumentCard document={documentRapport}>{mutationActions}</DocumentCard>
    );

    expect(container.innerHTML).toMatchSnapshot();
  });

  test('refuse un enfant qui n est pas les actions de la carte', () => {
    expect(() =>
      render(
        <DocumentCard document={preuveReglementaireFichier}>
          <span>{'intrus'}</span>
        </DocumentCard>
      )
    ).toThrow(
      'DocumentCard only accepts its own actions and content as direct children'
    );
  });

  test('refuse une action enveloppee dans un composant intermediaire', () => {
    const WrappedDelete = () => <DocumentCard.Delete />;

    expect(() =>
      render(
        <DocumentCard document={preuveReglementaireFichier}>
          <DocumentCard.Actions>
            <WrappedDelete />
          </DocumentCard.Actions>
        </DocumentCard>
      )
    ).toThrow(
      'DocumentCard.Actions only accepts its own actions as direct children'
    );
  });

  test('le menu garde l ordre du design system quel que soit l ordre de declaration', () => {
    const { container } = render(
      <DocumentCard document={preuveReglementaireFichier}>
        <DocumentCard.Actions>
          <DocumentCard.Delete />
          <DocumentCard.Comment />
          <DocumentCard.Edit />
        </DocumentCard.Actions>
      </DocumentCard>
    );

    expect(
      [...container.querySelectorAll('button')].map((button) =>
        button.getAttribute('title')
      )
    ).toEqual(['Éditer le document', 'Commenter', 'Supprimer']);
  });

  test('refuse deux fois la meme action', () => {
    expect(() =>
      render(
        <DocumentCard document={preuveReglementaireFichier}>
          <DocumentCard.Actions>
            <DocumentCard.Delete />
            <DocumentCard.Delete />
          </DocumentCard.Actions>
        </DocumentCard>
      )
    ).toThrow(
      'DocumentCard.Actions renders each of its own actions at most once'
    );
  });

  test('refuse deux fois le meme contenu', () => {
    expect(() =>
      render(
        <DocumentCard document={preuveReglementaireFichier}>
          <DocumentCard.Identifier value="1.1.1" />
          <DocumentCard.Identifier value="1.1.2" />
        </DocumentCard>
      )
    ).toThrow(
      'DocumentCard renders each of its own actions and content at most once'
    );
  });

  test('refuse une action rendue hors de la carte', () => {
    expect(() => render(<DocumentCard.Delete />)).toThrow(
      'DocumentCard actions must be rendered inside a DocumentCard'
    );
  });

  test('un clic sur supprimer ouvre la confirmation de suppression', () => {
    render(
      <DocumentCard document={preuveReglementaireFichier}>
        {mutationActions}
      </DocumentCard>
    );

    fireEvent.click(screen.getByRole('button', { name: 'Supprimer' }));

    expect(screen.getByRole('dialog')).toBeTruthy();
    expect(screen.getByText('Supprimer le document')).toBeTruthy();
  });

  test('un clic sur editer ouvre la modale de renommage pour un fichier', () => {
    render(
      <DocumentCard document={preuveReglementaireFichier}>
        {mutationActions}
      </DocumentCard>
    );

    fireEvent.click(screen.getByRole('button', { name: 'Éditer le document' }));

    expect(screen.getByText('Editer le document')).toBeTruthy();
  });

  test('un clic sur editer ouvre la modale de lien pour un lien', () => {
    render(
      <DocumentCard document={preuveReglementaireLien}>
        {mutationActions}
      </DocumentCard>
    );

    fireEvent.click(screen.getByRole('button', { name: 'Éditer le lien' }));

    expect(screen.getByText('Editer le lien')).toBeTruthy();
  });

  test("un clic sur remplacer ouvre la modale de remplacement d'un rapport d'audit", () => {
    render(
      <DocumentCard document={documentAudit}>
        <DocumentCard.Actions>
          <DocumentCard.Edit />
          <DocumentCard.Comment />
          <DocumentCard.Replace onReplace={vi.fn()} />
        </DocumentCard.Actions>
      </DocumentCard>
    );

    fireEvent.click(
      screen.getByRole('button', { name: 'Remplacer le fichier' })
    );

    expect(screen.getByRole('dialog')).toBeTruthy();
  });
});
