import '@testing-library/jest-dom/vitest';

import { uiLabels } from '@tet/ui/labels/catalog';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ChecklistTable } from './ChecklistTable';

const head = (
  <ChecklistTable.Head
    labelHeader="Critères attendus"
    answerHeader="Réponses"
  />
);

const renderTable = (caption?: string) =>
  render(
    <ChecklistTable caption={caption}>
      {head}
      <ChecklistTable.Row
        done={true}
        criterion={{
          label: 'Compléter le diagnostic',
          action: <button type="button">Voir la liste</button>,
        }}
        answer="Tous les critères renseignés"
      />
      <ChecklistTable.Row
        done={false}
        criterion={{ label: 'Score minimum atteint' }}
        answer="Obtenir 35% au minimum"
      />
      <ChecklistTable.Row
        done={null}
        criterion={{ label: 'Critère facultatif' }}
        answer="Sans statut"
      />
    </ChecklistTable>
  );

describe('ChecklistTable — structure', () => {
  it('rend une <table> avec le caption fourni comme nom accessible', () => {
    renderTable('Critères de labellisation');
    expect(
      screen.getByRole('table', { name: 'Critères de labellisation' })
    ).toBeInTheDocument();
  });

  it('rend exactement trois columnheaders', () => {
    renderTable();
    expect(screen.getAllByRole('columnheader')).toHaveLength(3);
  });

  it('expose le libellé des colonnes label et answer', () => {
    renderTable();
    expect(
      screen.getByRole('columnheader', { name: 'Critères attendus' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('columnheader', { name: 'Réponses' })
    ).toBeInTheDocument();
  });

  it('donne un nom accessible au columnheader statut via uiLabels', () => {
    renderTable();
    expect(
      screen.getByRole('columnheader', { name: uiLabels.statutDuCritere })
    ).toBeInTheDocument();
  });
});

describe('ChecklistTable — accessibilité du statut', () => {
  it('expose critereAtteint via aria-label pour une row done', () => {
    renderTable();
    expect(screen.getByLabelText(uiLabels.critereAtteint)).toBeInTheDocument();
  });

  it('expose critereNonAtteint via aria-label pour une row notDone', () => {
    renderTable();
    expect(
      screen.getByLabelText(uiLabels.critereNonAtteint)
    ).toBeInTheDocument();
  });

  it('n’affiche aucune icône de statut quand done vaut null', () => {
    renderTable();
    // Une seule icône de chaque statut : la troisième row n'en rend aucune.
    expect(screen.getAllByRole('img')).toHaveLength(2);
  });
});

describe('ChecklistTable — colonne de statut optionnelle', () => {
  const renderSansStatut = () =>
    render(
      <ChecklistTable hasStatusColumn={false}>
        {head}
        <ChecklistTable.Row
          criterion={{ label: 'Diagnostic' }}
          answer="diagnostic.pdf"
        />
      </ChecklistTable>
    );

  it('ne rend que les columnheaders label et answer', () => {
    renderSansStatut();
    expect(screen.getAllByRole('columnheader')).toHaveLength(2);
    expect(
      screen.queryByRole('columnheader', { name: uiLabels.statutDuCritere })
    ).toBeNull();
  });

  it('ne rend aucune icône de statut', () => {
    renderSansStatut();
    expect(screen.queryAllByRole('img')).toHaveLength(0);
  });
});

describe('ChecklistTable — action', () => {
  it('rend l’action dans la cellule criterion', () => {
    renderTable();
    expect(
      screen.getByRole('button', { name: 'Voir la liste' })
    ).toBeInTheDocument();
  });

  it('cache l’action par défaut et la révèle au hover ou au focus', () => {
    renderTable();
    const action = screen.getByRole('button', { name: 'Voir la liste' });
    expect(action.parentElement).toHaveClass(
      'opacity-0',
      'group-hover:opacity-100',
      'group-focus-within:opacity-100'
    );
  });

  it('ne rend pas de bouton dans la cellule criterion quand action est absent', () => {
    renderTable();
    expect(screen.getAllByRole('button')).toHaveLength(1);
  });
});

describe('ChecklistTable — ligne de pied', () => {
  const renderWithFooter = ({
    hasTagColumn = false,
    hasStatusColumn = true,
  }: { hasTagColumn?: boolean; hasStatusColumn?: boolean } = {}) =>
    render(
      <ChecklistTable
        hasTagColumn={hasTagColumn}
        hasStatusColumn={hasStatusColumn}
      >
        <ChecklistTable.Head
          labelHeader="Critères attendus"
          answerHeader="Réponses"
          tagHeader="Type"
        />
        <ChecklistTable.Row
          done={null}
          criterion={{ label: 'Critère facultatif' }}
          answer="Sans statut"
        />
        <ChecklistTable.FooterRow>
          <button type="button">+ Ajouter un document</button>
        </ChecklistTable.FooterRow>
      </ChecklistTable>
    );

  const footerCell = () =>
    screen.getByRole('button', { name: '+ Ajouter un document' }).closest('td');

  it('rend l’action de pied de table', () => {
    renderWithFooter();
    expect(
      screen.getByRole('button', { name: '+ Ajouter un document' })
    ).toBeInTheDocument();
  });

  it('traverse les colonnes de la table, quelles qu’elles soient', () => {
    const { unmount } = renderWithFooter();
    expect(footerCell()).toHaveAttribute('colspan', '3');
    unmount();

    const withTag = renderWithFooter({ hasTagColumn: true });
    expect(footerCell()).toHaveAttribute('colspan', '4');
    withTag.unmount();

    // Table des documents : étiquette sans colonne de statut.
    const withoutStatus = renderWithFooter({
      hasTagColumn: true,
      hasStatusColumn: false,
    });
    expect(footerCell()).toHaveAttribute('colspan', '3');
    withoutStatus.unmount();

    renderWithFooter({ hasStatusColumn: false });
    expect(footerCell()).toHaveAttribute('colspan', '2');
  });
});

describe('ChecklistTable — caption optionnel', () => {
  it("ne rend pas d'accessible name quand caption n'est pas fourni", () => {
    renderTable();
    expect(screen.queryByRole('table', { name: /./ })).toBeNull();
    expect(screen.getByRole('table')).toBeInTheDocument();
  });
});
