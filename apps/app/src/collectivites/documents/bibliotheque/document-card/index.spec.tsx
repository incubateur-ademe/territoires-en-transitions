import { appLabels } from '@/app/labels/catalog';
import {
  toDocumentHash,
  toLegacyDocumentHash,
} from '@tet/domain/collectivites';
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { DocumentCard } from '.';
import {
  preuveComplementaireFichier,
  preuveComplementaireLien,
  preuveReglementaireFichier,
  preuveReglementaireLien,
  preuveReglementaireNonRenseignee,
} from '../documents.fixture';
import {
  DocumentAudit,
  DocumentRapport,
  DocumentReglementaire,
} from '../types';

const { openPreuve, removePreuve, updateCommentaire } = vi.hoisted(() => ({
  openPreuve: vi.fn(),
  removePreuve: vi.fn(),
  updateCommentaire: vi.fn(),
}));

vi.mock(
  '../use-open-preuve',
  (): Partial<Record<keyof typeof import('../use-open-preuve'), unknown>> => ({
    useOpenPreuve: () => openPreuve,
  })
);

const toMutation = () => ({ mutate: vi.fn(), isPending: false });

vi.mock(
  '../use-edit-preuve',
  (): Partial<Record<keyof typeof import('../use-edit-preuve'), unknown>> => ({
    useRemovePreuve: () => ({ mutate: removePreuve, isPending: false }),
    useUpdatePreuveCommentaire: () => ({
      mutate: updateCommentaire,
      isPending: false,
    }),
    useUpdatePreuveLien: () => toMutation(),
    useUpdateBibliothequeFichier: () => toMutation(),
  })
);

const FICHIER_CHOISI_ID = 42;

vi.mock('@/app/collectivites/documents/add-document/add-document.tabs', () => ({
  AddDocumentTabs: ({
    handlers,
  }: {
    handlers: { addFile: (fichierId: number) => void };
  }) => (
    <button onClick={() => handlers.addFile(42)}>
      {'Choisir dans la bibliotheque'}
    </button>
  ),
}));

const MUTATION_ACTIONS = { edit: true, comment: true, remove: true };

const documentFichierManquant: DocumentReglementaire = {
  preuveType: 'reglementaire',
  id: 7,
  collectiviteId: 1,
  type: 'fichierManquant',
  filename: 'rapport-perdu.pdf',
  commentaire: '',
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

const fichierConfidentiel: DocumentReglementaire = {
  preuveType: 'reglementaire',
  id: 2,
  collectiviteId: 1,
  type: 'fichier',
  fichier: {
    id: 21,
    collectiviteId: 1,
    hash: toDocumentHash(
      'c9df071601f3f72b5430a55cd7ea584be5c2a36bb4226b621c4dca50088ef8b9'
    ),
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

const documentAudit: DocumentAudit = {
  preuveType: 'audit',
  id: 5,
  collectiviteId: 1,
  type: 'fichier',
  fichier: {
    id: 22,
    collectiviteId: 1,
    hash: toLegacyDocumentHash('a1b2c3'),
    filename: 'rapport-audit.pdf',
    filesize: 1024,
    bucketId: '9d4ccd86-268b-4292-aeda-18bfbe6496df',
    confidentiel: false,
  },
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

const documentRapport: DocumentRapport = {
  preuveType: 'rapport',
  id: 6,
  collectiviteId: 1,
  type: 'fichier',
  fichier: {
    id: 23,
    collectiviteId: 1,
    hash: toLegacyDocumentHash('d4e5f6'),
    filename: 'visite-annuelle.pdf',
    filesize: 2048,
    bucketId: '9d4ccd86-268b-4292-aeda-18bfbe6496df',
    confidentiel: false,
  },
  commentaire: '',
  modifiedAt: '2022-09-06T16:43:41.423515+00:00',
  modifiedBy: '17440546-f389-4d4f-bfdb-b0c94a1bd0f9',
  modifiedByNom: 'Yolo Dodo',
  rapport: { date: '2022-06-15' },
};

const cardChildren = (container: HTMLElement): Element[] => [
  ...(container.querySelector('[data-test="carte-doc"]')?.children ?? []),
];

const menuButtonLabels = (container: HTMLElement): string[] =>
  [...container.querySelectorAll('button')]
    .filter((button) => button.textContent?.trim() === '')
    .map((button) => button.getAttribute('title') ?? '');

describe('DocumentCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('rend un document de type fichier', () => {
    const { container } = render(
      <DocumentCard
        document={preuveReglementaireFichier}
        actions={MUTATION_ACTIONS}
      />
    );

    expect(container.innerHTML).toMatchSnapshot();
  });

  test('rend un document de type lien', () => {
    const { container } = render(
      <DocumentCard
        document={preuveReglementaireLien}
        actions={MUTATION_ACTIONS}
      />
    );

    expect(container.innerHTML).toMatchSnapshot();
  });

  test('signale un fichier confidentiel par un cadenas', () => {
    const { container } = render(
      <DocumentCard document={fichierConfidentiel} actions={MUTATION_ACTIONS} />
    );

    expect(
      container.querySelector('[data-test="carte-doc-confidentiel"]')
    ).toBeTruthy();
    expect(container.innerHTML).toMatchSnapshot();
  });

  test('ne rend rien pour un attendu sans depot', () => {
    const { container } = render(
      <DocumentCard
        document={preuveReglementaireNonRenseignee}
        actions={MUTATION_ACTIONS}
      />
    );

    expect(container.innerHTML).toBe('');
  });

  test('rend un document sans menu quand aucune action n est declaree', () => {
    const { container } = render(
      <DocumentCard document={preuveReglementaireFichier} />
    );

    expect(cardChildren(container)).toHaveLength(1);
    expect(container.innerHTML).toMatchSnapshot();
  });

  test("affiche l'identifiant de la mesure quand il est demande", () => {
    const { container } = render(
      <DocumentCard
        document={preuveComplementaireFichier}
        identifier={preuveComplementaireFichier.action.identifiant}
        actions={MUTATION_ACTIONS}
      />
    );

    expect(container.innerHTML).toMatchSnapshot();
  });

  test('signale un document deja present dans la bibliotheque', () => {
    const { container } = render(
      <DocumentCard
        document={preuveReglementaireFichier}
        duplicate={{ storedFilenameKept: true }}
        actions={MUTATION_ACTIONS}
      />
    );

    expect(container.innerHTML).toMatchSnapshot();
  });

  test('ne rend aucun bloc commentaire quand le document n en porte pas', () => {
    const { container } = render(
      <DocumentCard
        document={preuveComplementaireLien}
        actions={MUTATION_ACTIONS}
      />
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
        actions={MUTATION_ACTIONS}
      />
    );

    expect(screen.getByRole('button', { name: 'Voir plus' })).toBeTruthy();
    expect(container.innerHTML).toMatchSnapshot();
  });

  test("garde le commentaire deplie quand l'identifiant apparait", () => {
    const document = {
      ...preuveComplementaireFichier,
      commentaire: COMMENTAIRE_LONG,
    };
    const { container, rerender } = render(
      <DocumentCard document={document} actions={MUTATION_ACTIONS} />
    );
    fireEvent.click(screen.getByRole('button', { name: 'Voir plus' }));

    rerender(
      <DocumentCard
        document={document}
        identifier="1.1.3"
        actions={MUTATION_ACTIONS}
      />
    );

    expect(container.querySelector('[data-test="comment"]')?.textContent).toBe(
      COMMENTAIRE_LONG
    );
  });

  test('remplace le commentaire par sa saisie et masque le menu pendant l edition', () => {
    const { container } = render(
      <DocumentCard
        document={preuveComplementaireFichier}
        actions={MUTATION_ACTIONS}
      />
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
      <DocumentCard
        document={documentAudit}
        actions={{ edit: true, comment: true, replace: vi.fn() }}
      />
    );

    expect(
      screen.getByRole('button', { name: 'Remplacer le fichier' })
    ).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Supprimer' })).toBeNull();
    expect(container.innerHTML).toMatchSnapshot();
  });

  test('un rapport de visite affiche la date de visite', () => {
    const { container } = render(
      <DocumentCard document={documentRapport} actions={MUTATION_ACTIONS} />
    );

    expect(container.innerHTML).toMatchSnapshot();
  });

  test('un clic sur le titre ouvre le document', () => {
    render(<DocumentCard document={preuveReglementaireFichier} />);

    fireEvent.click(screen.getByRole('button', { name: /preuve_input\.txt/ }));

    expect(openPreuve).toHaveBeenCalledWith(preuveReglementaireFichier);
  });

  test("le titre d'un fichier est un bouton nommé par le nom du fichier", () => {
    render(<DocumentCard document={preuveReglementaireFichier} />);

    expect(
      screen.getByRole('button', { name: /preuve_input\.txt/ })
    ).toBeTruthy();
  });

  test("le titre d'un lien est un bouton nommé par le titre du lien", () => {
    render(<DocumentCard document={preuveReglementaireLien} />);

    expect(screen.getByRole('button', { name: 'dodo' })).toBeTruthy();
  });

  test('le titre est focusable', () => {
    render(<DocumentCard document={preuveReglementaireFichier} />);
    const titleButton = screen.getByRole('button', {
      name: /preuve_input\.txt/,
    });

    titleButton.focus();

    expect(document.activeElement).toBe(titleButton);
  });

  test("le nom d'un fichier introuvable n'est pas un bouton", () => {
    render(<DocumentCard document={documentFichierManquant} />);

    expect(
      screen.queryByRole('button', { name: /rapport-perdu\.pdf/ })
    ).toBeNull();
  });

  test('deplier puis replier le commentaire tronque', () => {
    const document = {
      ...preuveComplementaireFichier,
      commentaire: COMMENTAIRE_LONG,
    };
    const { container } = render(<DocumentCard document={document} />);
    const comment = () =>
      container.querySelector('[data-test="comment"]')?.textContent;

    expect(comment()).not.toBe(COMMENTAIRE_LONG);

    fireEvent.click(screen.getByRole('button', { name: 'Voir plus' }));
    expect(comment()).toBe(COMMENTAIRE_LONG);

    fireEvent.click(screen.getByRole('button', { name: 'Voir moins' }));
    expect(comment()).not.toBe(COMMENTAIRE_LONG);
  });

  test('la saisie du commentaire est enregistree a la sortie du champ', () => {
    render(
      <DocumentCard
        document={preuveComplementaireFichier}
        actions={MUTATION_ACTIONS}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Commenter' }));
    const textarea = screen.getByRole('textbox');
    fireEvent.change(textarea, { target: { value: 'nouveau commentaire' } });
    fireEvent.blur(textarea);

    expect(updateCommentaire).toHaveBeenCalledWith({
      ...preuveComplementaireFichier,
      commentaire: 'nouveau commentaire',
    });
  });

  test('un commentaire inchange n est pas renvoye au serveur', () => {
    render(
      <DocumentCard
        document={preuveComplementaireFichier}
        actions={MUTATION_ACTIONS}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Commenter' }));
    fireEvent.blur(screen.getByRole('textbox'));

    expect(updateCommentaire).not.toHaveBeenCalled();
  });

  test('confirmer la suppression supprime le document', () => {
    render(
      <DocumentCard
        document={preuveReglementaireFichier}
        actions={MUTATION_ACTIONS}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Supprimer' }));
    fireEvent.click(screen.getByRole('button', { name: 'Valider' }));

    expect(removePreuve).toHaveBeenCalledWith(preuveReglementaireFichier);
  });

  test('annuler la suppression ne supprime pas le document', () => {
    render(
      <DocumentCard
        document={preuveReglementaireFichier}
        actions={MUTATION_ACTIONS}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Supprimer' }));
    fireEvent.click(screen.getByRole('button', { name: 'Annuler' }));

    expect(removePreuve).not.toHaveBeenCalled();
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  test('choisir un fichier dans la modale declenche le remplacement', () => {
    const onReplace = vi.fn().mockResolvedValue(undefined);
    render(
      <DocumentCard document={documentAudit} actions={{ replace: onReplace }} />
    );

    fireEvent.click(
      screen.getByRole('button', { name: 'Remplacer le fichier' })
    );
    fireEvent.click(
      screen.getByRole('button', { name: 'Choisir dans la bibliotheque' })
    );

    expect(onReplace).toHaveBeenCalledWith(FICHIER_CHOISI_ID);
  });

  test('un fichier introuvable affiche son nom', () => {
    render(<DocumentCard document={documentFichierManquant} />);

    expect(screen.getByText(/rapport-perdu\.pdf/)).toBeTruthy();
  });

  test('un fichier introuvable est signalé par un badge', () => {
    const { container } = render(
      <DocumentCard document={documentFichierManquant} />
    );

    expect(container.querySelector('.ri-error-warning-fill')).toBeTruthy();
  });

  test('un fichier introuvable annonce son indisponibilité en toutes lettres', () => {
    render(<DocumentCard document={documentFichierManquant} />);

    expect(screen.getByText(appLabels.fichierIndisponible)).toBeTruthy();
  });

  test('un fichier confidentiel annonce son mode privé en toutes lettres', () => {
    render(<DocumentCard document={fichierConfidentiel} />);

    expect(screen.getByText(appLabels.fichierModePrive)).toBeTruthy();
  });

  test("un fichier introuvable n'offre pas l'édition", () => {
    render(
      <DocumentCard
        document={documentFichierManquant}
        actions={MUTATION_ACTIONS}
      />
    );

    expect(
      screen.queryByRole('button', { name: appLabels.editerDocument })
    ).toBeNull();
    expect(
      screen.queryByRole('button', { name: appLabels.supprimer })
    ).toBeTruthy();
  });

  test('une action non offerte ne donne pas son entree de menu', () => {
    render(
      <DocumentCard
        document={preuveReglementaireFichier}
        actions={{ edit: true }}
      />
    );

    expect(
      screen.getByRole('button', { name: 'Éditer le document' })
    ).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Supprimer' })).toBeNull();
  });

  test('une carte sans actions ne rend pas le menu', () => {
    const { container } = render(
      <DocumentCard document={preuveReglementaireFichier} />
    );

    expect(cardChildren(container)).toHaveLength(1);
  });

  test('un lot d actions vide ne rend rien', () => {
    const { container } = render(
      <DocumentCard document={preuveReglementaireFichier} actions={{}} />
    );

    expect(cardChildren(container)).toHaveLength(1);
  });

  test('le menu garde l ordre du design system quel que soit l ordre des cles', () => {
    const { container } = render(
      <DocumentCard
        document={preuveReglementaireFichier}
        actions={{ remove: true, comment: true, edit: true }}
      />
    );

    expect(menuButtonLabels(container)).toEqual([
      'Éditer le document',
      'Commenter',
      'Supprimer',
    ]);
  });

  test('un clic sur supprimer ouvre la confirmation de suppression', () => {
    render(
      <DocumentCard
        document={preuveReglementaireFichier}
        actions={MUTATION_ACTIONS}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Supprimer' }));

    expect(screen.getByRole('dialog')).toBeTruthy();
    expect(screen.getByText('Supprimer le document')).toBeTruthy();
  });

  test('un clic sur editer ouvre la modale de renommage pour un fichier', () => {
    render(
      <DocumentCard
        document={preuveReglementaireFichier}
        actions={MUTATION_ACTIONS}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Éditer le document' }));

    expect(screen.getByText(appLabels.editerDocument)).toBeTruthy();
  });

  test('un clic sur editer ouvre la modale de lien pour un lien', () => {
    render(
      <DocumentCard
        document={preuveReglementaireLien}
        actions={MUTATION_ACTIONS}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Éditer le lien' }));

    expect(screen.getByText(appLabels.editerLien)).toBeTruthy();
  });

  test("un clic sur remplacer ouvre la modale de remplacement d'un rapport d'audit", () => {
    render(
      <DocumentCard
        document={documentAudit}
        actions={{ edit: true, comment: true, replace: vi.fn() }}
      />
    );

    fireEvent.click(
      screen.getByRole('button', { name: 'Remplacer le fichier' })
    );

    expect(screen.getByRole('dialog')).toBeTruthy();
  });
});
