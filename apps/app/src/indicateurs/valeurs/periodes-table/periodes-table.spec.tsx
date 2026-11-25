import { render, screen } from '@testing-library/react';
import {
  IndicateurPeriodes,
  IndicateurPeriodiciteEnum,
} from '@tet/domain/indicateurs';
import { TableHeaderCell } from '@tet/ui';
import { describe, expect, it, vi } from 'vitest';
import { PeriodesTable } from './periodes-table';
import type { PeriodeTableRow } from './periodes-table.types';

const PERIODE_2022 = IndicateurPeriodes.parse(
  IndicateurPeriodiciteEnum.ANNUELLE,
  '2022'
);

const ROW: PeriodeTableRow = {
  key: 'ménagers',
  title: <TableHeaderCell scope="row">{'Ménagers'}</TableHeaderCell>,
  cellOf: () => ({ kind: 'contenu', content: '12', isBold: false }),
  onSave: vi.fn().mockResolvedValue(true),
};

const COMMENTAIRES = {
  isReadonly: false,
  countOf: () => 0,
  canComment: () => true,
  onComment: vi.fn(),
};

const NO_LAST_ROW_BOTTOM_BORDER = '[&>tr:last-child>*]:border-b-0';

const getBody = (): HTMLElement => screen.getAllByRole('rowgroup')[1];

describe('PeriodesTable : bord bas', () => {
  it("retire la bordure basse de la dernière ligne quand aucun pied n'est affiché, pour ne pas la doubler avec le cadre du tableau", () => {
    render(
      <PeriodesTable
        title="Déchets"
        unite="t"
        periodes={[]}
        rows={[ROW]}
        addPeriode={<span>{'Ajouter une année'}</span>}
        commentaires={COMMENTAIRES}
      />
    );

    expect(getBody().className).toContain(NO_LAST_ROW_BOTTOM_BORDER);
  });

  it('garde la bordure basse des lignes quand le pied de commentaires ferme le tableau', () => {
    render(
      <PeriodesTable
        title="Déchets"
        unite="t"
        periodes={[PERIODE_2022]}
        rows={[ROW]}
        commentaires={COMMENTAIRES}
      />
    );

    expect(getBody().className).not.toContain(NO_LAST_ROW_BOTTOM_BORDER);
  });

  it("retire la bordure basse de la dernière ligne quand le pied n'a aucun commentaire à montrer en lecture seule", () => {
    render(
      <PeriodesTable
        title="Déchets"
        unite="t"
        periodes={[PERIODE_2022]}
        rows={[ROW]}
        readonly
        commentaires={{ ...COMMENTAIRES, isReadonly: true }}
      />
    );

    expect(getBody().className).toContain(NO_LAST_ROW_BOTTOM_BORDER);
  });
});
