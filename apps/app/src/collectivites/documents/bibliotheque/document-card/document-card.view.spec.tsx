import { appLabels } from '@/app/labels/catalog';
import {
  toDocumentHash,
  toLegacyDocumentHash,
} from '@tet/domain/collectivites';
import { fireEvent, render, screen } from '@testing-library/react';
import { JSX } from 'react';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { DocumentCardView } from './document-card.view';
import {
  preuveComplementaireFichier,
  preuveComplementaireLien,
  preuveReglementaireFichier,
  preuveReglementaireLien,
  preuveReglementaireNonRenseignee,
} from '../documents.fixture';
import type { EditDocumentModalProps } from '../edit-document.modal';
import {
  DocumentAudit,
  DocumentRapport,
  DocumentReglementaire,
} from '../types';

vi.mock('../edit-document.modal', () => ({
  EditDocumentModal: ({ document }: EditDocumentModalProps): JSX.Element => (
    <div role="dialog">{document.type}</div>
  ),
}));

const FICHIER_CHOISI_ID = 42;

vi.mock('@/app/collectivites/documents/add-document/add-document.tabs', () => ({
  AddDocumentTabs: ({
    handlers,
  }: {
    handlers: { addFileFromLib: (fichierId: number) => void };
  }) => (
    <button onClick={() => handlers.addFileFromLib(42)}>
      {'Choisir dans la bibliotheque'}
    </button>
  ),
}));

const onOpen = vi.fn();
const onSaveCommentaire = vi.fn();
const onDelete = vi.fn();
const cardHandlers = { onOpen, onSaveCommentaire, onDelete };

const mutationActions = (
  <DocumentCardView.Actions>
    <DocumentCardView.Edit />
    <DocumentCardView.Comment />
    <DocumentCardView.Delete />
  </DocumentCardView.Actions>
);

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

describe('DocumentCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('rend un document de type fichier', () => {
    const { container } = render(
      <DocumentCardView document={preuveReglementaireFichier} {...cardHandlers}>
        {mutationActions}
      </DocumentCardView>
    );

    expect(container.innerHTML).toMatchSnapshot();
  });

  test('rend un document de type lien', () => {
    const { container } = render(
      <DocumentCardView document={preuveReglementaireLien} {...cardHandlers}>
        {mutationActions}
      </DocumentCardView>
    );

    expect(container.innerHTML).toMatchSnapshot();
  });

  test('signale un fichier confidentiel par un cadenas', () => {
    const { container } = render(
      <DocumentCardView document={fichierConfidentiel} {...cardHandlers}>
        {mutationActions}
      </DocumentCardView>
    );

    expect(
      container.querySelector('[data-test="carte-doc-confidentiel"]')
    ).toBeTruthy();
    expect(container.innerHTML).toMatchSnapshot();
  });

  test('ne rend rien pour un attendu sans depot', () => {
    const { container } = render(
      <DocumentCardView
        document={preuveReglementaireNonRenseignee}
        {...cardHandlers}
      >
        {mutationActions}
      </DocumentCardView>
    );

    expect(container.innerHTML).toBe('');
  });

  test('rend un document sans menu quand aucune action n est declaree', () => {
    const { container } = render(
      <DocumentCardView
        document={preuveReglementaireFichier}
        {...cardHandlers}
      />
    );

    expect(container.querySelector('button')).toBeNull();
    expect(container.innerHTML).toMatchSnapshot();
  });

  test("affiche l'identifiant de la mesure quand il est demande", () => {
    const { container } = render(
      <DocumentCardView
        document={preuveComplementaireFichier}
        {...cardHandlers}
      >
        <DocumentCardView.Identifier
          value={preuveComplementaireFichier.action.identifiant}
        />
        {mutationActions}
      </DocumentCardView>
    );

    expect(container.innerHTML).toMatchSnapshot();
  });

  test('signale un document deja present dans la bibliotheque', () => {
    const { container } = render(
      <DocumentCardView document={preuveReglementaireFichier} {...cardHandlers}>
        <DocumentCardView.Duplicate
          information={{ storedFilenameKept: true }}
        />
        {mutationActions}
      </DocumentCardView>
    );

    expect(container.innerHTML).toMatchSnapshot();
  });

  test('ne rend aucun bloc commentaire quand le document n en porte pas', () => {
    const { container } = render(
      <DocumentCardView document={preuveComplementaireLien} {...cardHandlers}>
        {mutationActions}
      </DocumentCardView>
    );

    expect(container.querySelector('[data-test="comment"]')).toBeNull();
    expect(container.innerHTML).toMatchSnapshot();
  });

  test('tronque un commentaire de plus de 160 caracteres et offre de le deplier', () => {
    const { container } = render(
      <DocumentCardView
        document={{
          ...preuveComplementaireFichier,
          commentaire: COMMENTAIRE_LONG,
        }}
        {...cardHandlers}
      >
        {mutationActions}
      </DocumentCardView>
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
      <DocumentCardView document={document} {...cardHandlers}>
        {mutationActions}
      </DocumentCardView>
    );
    fireEvent.click(screen.getByRole('button', { name: 'Voir plus' }));

    rerender(
      <DocumentCardView document={document} {...cardHandlers}>
        <DocumentCardView.Identifier value="1.1.3" />
        {mutationActions}
      </DocumentCardView>
    );

    expect(container.querySelector('[data-test="comment"]')?.textContent).toBe(
      COMMENTAIRE_LONG
    );
  });

  test('remplace le commentaire par sa saisie et masque le menu pendant l edition', () => {
    const { container } = render(
      <DocumentCardView
        document={preuveComplementaireFichier}
        {...cardHandlers}
      >
        {mutationActions}
      </DocumentCardView>
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
      <DocumentCardView document={documentAudit} {...cardHandlers}>
        <DocumentCardView.Actions>
          <DocumentCardView.Edit />
          <DocumentCardView.Comment />
          <DocumentCardView.Replace onReplace={vi.fn()} />
        </DocumentCardView.Actions>
      </DocumentCardView>
    );

    expect(
      screen.getByRole('button', { name: 'Remplacer le fichier' })
    ).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Supprimer' })).toBeNull();
    expect(container.innerHTML).toMatchSnapshot();
  });

  test('un rapport de visite affiche la date de visite', () => {
    const { container } = render(
      <DocumentCardView document={documentRapport} {...cardHandlers}>
        {mutationActions}
      </DocumentCardView>
    );

    expect(container.innerHTML).toMatchSnapshot();
  });

  test('un clic sur le titre ouvre le document', () => {
    render(
      <DocumentCardView
        document={preuveReglementaireFichier}
        {...cardHandlers}
      />
    );

    fireEvent.click(screen.getByTitle('Télécharger le fichier'));

    expect(onOpen).toHaveBeenCalledOnce();
  });

  test('deplier puis replier le commentaire tronque', () => {
    const document = {
      ...preuveComplementaireFichier,
      commentaire: COMMENTAIRE_LONG,
    };
    const { container } = render(
      <DocumentCardView document={document} {...cardHandlers} />
    );
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
      <DocumentCardView
        document={preuveComplementaireFichier}
        {...cardHandlers}
      >
        {mutationActions}
      </DocumentCardView>
    );

    fireEvent.click(screen.getByRole('button', { name: 'Commenter' }));
    const textarea = screen.getByRole('textbox');
    fireEvent.change(textarea, { target: { value: 'nouveau commentaire' } });
    fireEvent.blur(textarea);

    expect(onSaveCommentaire).toHaveBeenCalledWith('nouveau commentaire');
  });

  test('un commentaire inchange n est pas renvoye au serveur', () => {
    render(
      <DocumentCardView
        document={preuveComplementaireFichier}
        {...cardHandlers}
      >
        {mutationActions}
      </DocumentCardView>
    );

    fireEvent.click(screen.getByRole('button', { name: 'Commenter' }));
    fireEvent.blur(screen.getByRole('textbox'));

    expect(onSaveCommentaire).not.toHaveBeenCalled();
  });

  test('confirmer la suppression supprime le document', () => {
    render(
      <DocumentCardView document={preuveReglementaireFichier} {...cardHandlers}>
        {mutationActions}
      </DocumentCardView>
    );

    fireEvent.click(screen.getByRole('button', { name: 'Supprimer' }));
    fireEvent.click(screen.getByRole('button', { name: 'Valider' }));

    expect(onDelete).toHaveBeenCalledOnce();
  });

  test('annuler la suppression ne supprime pas le document', () => {
    render(
      <DocumentCardView document={preuveReglementaireFichier} {...cardHandlers}>
        {mutationActions}
      </DocumentCardView>
    );

    fireEvent.click(screen.getByRole('button', { name: 'Supprimer' }));
    fireEvent.click(screen.getByRole('button', { name: 'Annuler' }));

    expect(onDelete).not.toHaveBeenCalled();
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  test('choisir un fichier dans la modale declenche le remplacement', () => {
    const onReplace = vi.fn().mockResolvedValue(undefined);
    render(
      <DocumentCardView document={documentAudit} {...cardHandlers}>
        <DocumentCardView.Actions>
          <DocumentCardView.Replace onReplace={onReplace} />
        </DocumentCardView.Actions>
      </DocumentCardView>
    );

    fireEvent.click(
      screen.getByRole('button', { name: 'Remplacer le fichier' })
    );
    fireEvent.click(
      screen.getByRole('button', { name: 'Choisir dans la bibliotheque' })
    );

    expect(onReplace).toHaveBeenCalledWith(FICHIER_CHOISI_ID);
  });

  test('un fichier introuvable affiche son nom sans lien de téléchargement', () => {
    const { container } = render(
      <DocumentCardView document={documentFichierManquant} {...cardHandlers} />
    );

    const titre = container.querySelector('[data-test="name"]');
    expect(titre?.textContent).toContain('rapport-perdu.pdf');
    expect(titre?.getAttribute('title')).toBeNull();
  });

  test('un fichier introuvable est signalé par un badge', () => {
    const { container } = render(
      <DocumentCardView document={documentFichierManquant} {...cardHandlers} />
    );

    expect(container.querySelector('.ri-error-warning-fill')).toBeTruthy();
  });

  test("un fichier introuvable n'offre pas l'édition", () => {
    render(
      <DocumentCardView document={documentFichierManquant} {...cardHandlers}>
        {mutationActions}
      </DocumentCardView>
    );

    expect(
      screen.queryByRole('button', { name: appLabels.editerDocument })
    ).toBeNull();
    expect(
      screen.queryByRole('button', { name: appLabels.supprimer })
    ).toBeTruthy();
  });

  test('refuse un enfant qui n est pas les actions de la carte', () => {
    expect(() =>
      render(
        <DocumentCardView
          document={preuveReglementaireFichier}
          {...cardHandlers}
        >
          <span>{'intrus'}</span>
        </DocumentCardView>
      )
    ).toThrow(
      'DocumentCard only accepts its own actions and content as direct children'
    );
  });

  test('refuse une action enveloppee dans un composant intermediaire', () => {
    const WrappedDelete = () => <DocumentCardView.Delete />;

    expect(() =>
      render(
        <DocumentCardView
          document={preuveReglementaireFichier}
          {...cardHandlers}
        >
          <DocumentCardView.Actions>
            <WrappedDelete />
          </DocumentCardView.Actions>
        </DocumentCardView>
      )
    ).toThrow(
      'DocumentCard.Actions only accepts its own actions as direct children'
    );
  });

  test('une action masquee par visibleWhen ne donne pas son entree de menu', () => {
    const { container } = render(
      <DocumentCardView document={preuveReglementaireFichier} {...cardHandlers}>
        <DocumentCardView.Actions>
          <DocumentCardView.Edit />
          <DocumentCardView.Delete visibleWhen={false} />
        </DocumentCardView.Actions>
      </DocumentCardView>
    );

    expect(
      screen.getByRole('button', { name: 'Éditer le document' })
    ).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Supprimer' })).toBeNull();
    expect(container.querySelectorAll('button')).toHaveLength(1);
  });

  test('un conteneur d actions masque ne rend pas le menu', () => {
    const { container } = render(
      <DocumentCardView document={preuveReglementaireFichier} {...cardHandlers}>
        <DocumentCardView.Actions visibleWhen={false}>
          <DocumentCardView.Edit />
          <DocumentCardView.Comment />
          <DocumentCardView.Delete />
        </DocumentCardView.Actions>
      </DocumentCardView>
    );

    expect(cardChildren(container)).toHaveLength(1);
  });

  test('un menu dont chaque action est masquee ne rend rien', () => {
    const { container } = render(
      <DocumentCardView document={preuveReglementaireFichier} {...cardHandlers}>
        <DocumentCardView.Actions>
          <DocumentCardView.Edit visibleWhen={false} />
          <DocumentCardView.Comment visibleWhen={false} />
          <DocumentCardView.Delete visibleWhen={false} />
        </DocumentCardView.Actions>
      </DocumentCardView>
    );

    expect(cardChildren(container)).toHaveLength(1);
  });

  test('le menu garde l ordre du design system quel que soit l ordre de declaration', () => {
    const { container } = render(
      <DocumentCardView document={preuveReglementaireFichier} {...cardHandlers}>
        <DocumentCardView.Actions>
          <DocumentCardView.Delete />
          <DocumentCardView.Comment />
          <DocumentCardView.Edit />
        </DocumentCardView.Actions>
      </DocumentCardView>
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
        <DocumentCardView
          document={preuveReglementaireFichier}
          {...cardHandlers}
        >
          <DocumentCardView.Actions>
            <DocumentCardView.Delete />
            <DocumentCardView.Delete />
          </DocumentCardView.Actions>
        </DocumentCardView>
      )
    ).toThrow(
      'DocumentCard.Actions renders each of its own actions at most once'
    );
  });

  test('refuse deux fois le meme contenu', () => {
    expect(() =>
      render(
        <DocumentCardView
          document={preuveReglementaireFichier}
          {...cardHandlers}
        >
          <DocumentCardView.Identifier value="1.1.1" />
          <DocumentCardView.Identifier value="1.1.2" />
        </DocumentCardView>
      )
    ).toThrow(
      'DocumentCard renders each of its own actions and content at most once'
    );
  });

  test('refuse une action rendue hors de la carte', () => {
    expect(() => render(<DocumentCardView.Delete />)).toThrow(
      'DocumentCard actions must be rendered inside a DocumentCard'
    );
  });

  test('un clic sur supprimer ouvre la confirmation de suppression', () => {
    render(
      <DocumentCardView document={preuveReglementaireFichier} {...cardHandlers}>
        {mutationActions}
      </DocumentCardView>
    );

    fireEvent.click(screen.getByRole('button', { name: 'Supprimer' }));

    expect(screen.getByRole('dialog')).toBeTruthy();
    expect(screen.getByText('Supprimer le document')).toBeTruthy();
  });

  test('un clic sur editer ouvre la modale de renommage pour un fichier', () => {
    render(
      <DocumentCardView document={preuveReglementaireFichier} {...cardHandlers}>
        {mutationActions}
      </DocumentCardView>
    );

    fireEvent.click(screen.getByRole('button', { name: 'Éditer le document' }));

    expect(screen.getByRole('dialog').textContent).toBe('fichier');
  });

  test('un clic sur editer ouvre la modale de lien pour un lien', () => {
    render(
      <DocumentCardView document={preuveReglementaireLien} {...cardHandlers}>
        {mutationActions}
      </DocumentCardView>
    );

    fireEvent.click(screen.getByRole('button', { name: 'Éditer le lien' }));

    expect(screen.getByRole('dialog').textContent).toBe('lien');
  });

  test("un clic sur remplacer ouvre la modale de remplacement d'un rapport d'audit", () => {
    render(
      <DocumentCardView document={documentAudit} {...cardHandlers}>
        <DocumentCardView.Actions>
          <DocumentCardView.Edit />
          <DocumentCardView.Comment />
          <DocumentCardView.Replace onReplace={vi.fn()} />
        </DocumentCardView.Actions>
      </DocumentCardView>
    );

    fireEvent.click(
      screen.getByRole('button', { name: 'Remplacer le fichier' })
    );

    expect(screen.getByRole('dialog')).toBeTruthy();
  });
});
