import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';
import CarteDocument from './CarteDocument';
import { MUTATION_ACTIONS } from './carte-document-action';
import {
  preuveComplementaireFichier,
  preuveComplementaireLien,
  preuveReglementaireFichier,
  preuveReglementaireLien,
  preuveReglementaireNonRenseignee,
} from './fixture';
import { DocumentReglementaire, PreuveAudit, PreuveRapport } from './types';

const editComment = { enEdition: false };

const toEditState = (isEditing = false) => ({
  isEditing,
  enter: vi.fn(),
  exit: vi.fn(),
  value: '',
  setValue: vi.fn(),
  save: vi.fn(),
});

vi.mock('./use-open-preuve', () => ({
  useOpenPreuve: () => vi.fn(),
}));

const toMutation = () => ({ mutate: vi.fn(), isPending: false });

vi.mock('./useEditPreuve', () => ({
  useEditPreuve: () => ({
    remove: vi.fn(),
    editComment: toEditState(editComment.enEdition),
    editFilename: toEditState(),
    isLoading: false,
    isError: false,
  }),
  useRemovePreuve: () => toMutation(),
  useUpdatePreuveLien: () => toMutation(),
  useUpdateBibliothequeFichier: () => toMutation(),
}));

vi.mock('@/app/referentiels/preuves/AddPreuveModal', () => ({
  AddPreuveModal: () => null,
}));

vi.mock('./useReplaceAuditReportFile', () => ({
  useReplaceAuditReportFile: () => ({ mutateAsync: vi.fn() }),
}));

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

describe('CarteDocument', () => {
  test('rend un document de type fichier', () => {
    const { container } = render(
      <CarteDocument document={preuveReglementaireFichier}>
        <CarteDocument.Actions allowedActions={MUTATION_ACTIONS} />
        <CarteDocument.Title />
        <CarteDocument.Author />
        <CarteDocument.Comment />
      </CarteDocument>
    );

    expect(container.innerHTML).toMatchSnapshot();
  });

  test('rend un document de type lien', () => {
    const { container } = render(
      <CarteDocument document={preuveReglementaireLien}>
        <CarteDocument.Actions allowedActions={MUTATION_ACTIONS} />
        <CarteDocument.Title />
        <CarteDocument.Author />
        <CarteDocument.Comment />
      </CarteDocument>
    );

    expect(container.innerHTML).toMatchSnapshot();
  });

  test('signale un fichier confidentiel par un cadenas', () => {
    const { container } = render(
      <CarteDocument document={fichierConfidentiel}>
        <CarteDocument.Actions allowedActions={MUTATION_ACTIONS} />
        <CarteDocument.Title />
        <CarteDocument.Author />
        <CarteDocument.Comment />
      </CarteDocument>
    );

    expect(container.innerHTML).toMatchSnapshot();
  });

  test('ne rend rien pour un attendu sans depot', () => {
    const { container } = render(
      <CarteDocument document={preuveReglementaireNonRenseignee}>
        <CarteDocument.Actions allowedActions={MUTATION_ACTIONS} />
        <CarteDocument.Title />
        <CarteDocument.Author />
        <CarteDocument.Comment />
      </CarteDocument>
    );

    expect(container.innerHTML).toBe('');
  });

  test("rend un document sans aucun bouton quand aucune action n'est autorisee", () => {
    const { container } = render(
      <CarteDocument document={preuveReglementaireFichier}>
        <CarteDocument.Actions allowedActions={[]} />
        <CarteDocument.Title />
        <CarteDocument.Author />
        <CarteDocument.Comment />
      </CarteDocument>
    );

    expect(screen.queryByRole('button')).toBeNull();
    expect(container.innerHTML).toMatchSnapshot();
  });

  test("affiche l'identifiant de la mesure quand il est demande", () => {
    const { container } = render(
      <CarteDocument document={preuveComplementaireFichier}>
        <CarteDocument.Actions allowedActions={MUTATION_ACTIONS} />
        <CarteDocument.Title />
        <CarteDocument.Identifier
          identifiant={preuveComplementaireFichier.action.identifiant}
        />
        <CarteDocument.Author />
        <CarteDocument.Comment />
      </CarteDocument>
    );

    expect(container.innerHTML).toMatchSnapshot();
  });

  test('rend le commentaire du document avec la classe fournie', () => {
    const { container } = render(
      <CarteDocument document={preuveComplementaireFichier}>
        <CarteDocument.Actions allowedActions={MUTATION_ACTIONS} />
        <CarteDocument.Title />
        <CarteDocument.Author />
        <CarteDocument.Comment className="text-red-500" />
      </CarteDocument>
    );

    expect(container.innerHTML).toMatchSnapshot();
  });

  test('signale un document deja present dans la bibliotheque', () => {
    const { container } = render(
      <CarteDocument document={preuveReglementaireFichier}>
        <CarteDocument.Actions allowedActions={MUTATION_ACTIONS} />
        <CarteDocument.Title />
        <CarteDocument.Author />
        <CarteDocument.Duplicate information={{ storedFilenameKept: true }} />
        <CarteDocument.Comment />
      </CarteDocument>
    );

    expect(container.innerHTML).toMatchSnapshot();
  });
  test('ne rend aucun bloc commentaire quand le document n en porte pas', () => {
    const { container } = render(
      <CarteDocument document={preuveComplementaireLien}>
        <CarteDocument.Actions allowedActions={MUTATION_ACTIONS} />
        <CarteDocument.Title />
        <CarteDocument.Author />
        <CarteDocument.Comment />
      </CarteDocument>
    );

    expect(container.querySelector('[data-test="comment"]')).toBeNull();
    expect(container.innerHTML).toMatchSnapshot();
  });

  test('tronque un commentaire de plus de 160 caracteres et offre de le deplier', () => {
    const { container } = render(
      <CarteDocument
        document={{
          ...preuveComplementaireFichier,
          commentaire: COMMENTAIRE_LONG,
        }}
      >
        <CarteDocument.Actions allowedActions={MUTATION_ACTIONS} />
        <CarteDocument.Title />
        <CarteDocument.Author />
        <CarteDocument.Comment />
      </CarteDocument>
    );

    expect(screen.getByRole('button', { name: 'Voir plus' })).toBeTruthy();
    expect(container.innerHTML).toMatchSnapshot();
  });

  test('remplace le commentaire par sa saisie et masque le menu pendant l edition', () => {
    editComment.enEdition = true;
    const { container } = render(
      <CarteDocument document={preuveComplementaireFichier}>
        <CarteDocument.Actions allowedActions={MUTATION_ACTIONS} />
        <CarteDocument.Title />
        <CarteDocument.Author />
        <CarteDocument.Comment />
      </CarteDocument>
    );
    editComment.enEdition = false;

    expect(
      screen.queryByRole('button', { name: 'Éditer le document' })
    ).toBeNull();
    expect(container.innerHTML).toMatchSnapshot();
  });

  test("un rapport d'audit porte le remplacement de fichier et pas la suppression", () => {
    const { container } = render(
      <CarteDocument document={documentAudit}>
        <CarteDocument.Actions
          allowedActions={[...MUTATION_ACTIONS, 'replace']}
        />
        <CarteDocument.Title />
        <CarteDocument.Author />
        <CarteDocument.Comment />
      </CarteDocument>
    );

    expect(
      screen.getByRole('button', { name: 'Remplacer le fichier' })
    ).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Supprimer' })).toBeNull();
    expect(container.innerHTML).toMatchSnapshot();
  });

  test('un rapport de visite affiche la date de visite', () => {
    const { container } = render(
      <CarteDocument document={documentRapport}>
        <CarteDocument.Actions allowedActions={MUTATION_ACTIONS} />
        <CarteDocument.Title />
        <CarteDocument.Author />
        <CarteDocument.Comment />
        <CarteDocument.VisitDate date={documentRapport.rapport.date} />
      </CarteDocument>
    );

    expect(container.innerHTML).toMatchSnapshot();
  });
  test('refuse un enfant qui n est pas un slot de la carte', () => {
    expect(() =>
      render(
        <CarteDocument document={preuveReglementaireFichier}>
          <span>{'intrus'}</span>
        </CarteDocument>
      )
    ).toThrow('CarteDocument only accepts its own slots as direct children');
  });

  test('refuse deux fois le meme slot', () => {
    expect(() =>
      render(
        <CarteDocument document={preuveReglementaireFichier}>
          <CarteDocument.Title />
          <CarteDocument.Title />
        </CarteDocument>
      )
    ).toThrow('CarteDocument renders each of its slots at most once');
  });

  test('garde le commentaire deplie quand un slot conditionnel apparait', () => {
    const document = {
      ...preuveComplementaireFichier,
      commentaire: COMMENTAIRE_LONG,
    };
    const { container, rerender } = render(
      <CarteDocument document={document}>
        <CarteDocument.Title />
        <CarteDocument.Comment />
      </CarteDocument>
    );
    fireEvent.click(screen.getByRole('button', { name: 'Voir plus' }));

    rerender(
      <CarteDocument document={document}>
        <CarteDocument.Title />
        <CarteDocument.Identifier identifiant="1.1.3" />
        <CarteDocument.Comment />
      </CarteDocument>
    );

    expect(container.querySelector('[data-test="comment"]')?.textContent).toBe(
      COMMENTAIRE_LONG
    );
  });

  test('refuse un slot rendu hors de la carte', () => {
    expect(() => render(<CarteDocument.Title />)).toThrow(
      'CarteDocument slots must be rendered inside a CarteDocument'
    );
  });

  test('refuse un texte brut en enfant direct', () => {
    expect(() =>
      render(
        <CarteDocument document={preuveReglementaireFichier}>
          {'intrus'}
        </CarteDocument>
      )
    ).toThrow('CarteDocument only accepts its own slots as direct children');
  });

  test('refuse un slot enveloppe dans un composant intermediaire', () => {
    const WrappedActions = () => (
      <CarteDocument.Actions allowedActions={MUTATION_ACTIONS} />
    );

    expect(() =>
      render(
        <CarteDocument document={preuveReglementaireFichier}>
          <WrappedActions />
        </CarteDocument>
      )
    ).toThrow('CarteDocument only accepts its own slots as direct children');
  });

  test('un clic sur supprimer ouvre la confirmation de suppression', () => {
    render(
      <CarteDocument document={preuveReglementaireFichier}>
        <CarteDocument.Actions allowedActions={MUTATION_ACTIONS} />
        <CarteDocument.Title />
        <CarteDocument.Author />
        <CarteDocument.Comment />
      </CarteDocument>
    );

    fireEvent.click(screen.getByRole('button', { name: 'Supprimer' }));

    expect(screen.getByRole('dialog')).toBeTruthy();
    expect(screen.getByText('Supprimer le document')).toBeTruthy();
  });

  test('un clic sur editer ouvre la modale de renommage pour un fichier', () => {
    render(
      <CarteDocument document={preuveReglementaireFichier}>
        <CarteDocument.Actions allowedActions={MUTATION_ACTIONS} />
        <CarteDocument.Title />
        <CarteDocument.Author />
        <CarteDocument.Comment />
      </CarteDocument>
    );

    fireEvent.click(screen.getByRole('button', { name: 'Éditer le document' }));

    expect(screen.getByRole('dialog')).toBeTruthy();
  });

  test('un clic sur editer ouvre la modale de lien pour un lien', () => {
    render(
      <CarteDocument document={preuveReglementaireLien}>
        <CarteDocument.Actions allowedActions={MUTATION_ACTIONS} />
        <CarteDocument.Title />
        <CarteDocument.Author />
        <CarteDocument.Comment />
      </CarteDocument>
    );

    fireEvent.click(screen.getByRole('button', { name: 'Éditer le lien' }));

    expect(screen.getByRole('dialog')).toBeTruthy();
    expect(screen.getByText('Editer le lien')).toBeTruthy();
  });

  test("un clic sur remplacer ouvre la modale de remplacement d'un rapport d'audit", () => {
    render(
      <CarteDocument document={documentAudit}>
        <CarteDocument.Actions
          allowedActions={[...MUTATION_ACTIONS, 'replace']}
        />
        <CarteDocument.Title />
        <CarteDocument.Author />
        <CarteDocument.Comment />
      </CarteDocument>
    );

    fireEvent.click(
      screen.getByRole('button', { name: 'Remplacer le fichier' })
    );

    expect(screen.getByRole('dialog')).toBeTruthy();
  });
});
