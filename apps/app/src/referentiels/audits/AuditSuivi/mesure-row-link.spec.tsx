import { render, screen } from '@testing-library/react';
import { ActionTypeEnum } from '@tet/domain/referentiels';
import { Row } from 'react-table';
import { describe, expect, it } from 'vitest';
import {
  CellAction,
  TCellProps,
} from '../../DEPRECATED_ReferentielTable/CellAction';
import {
  mapToMatchReferentielTableRow,
  MesureAuditStatut,
} from './useTableData';

const COLLECTIVITE_ID = 3906;
const MESURE: MesureAuditStatut = {
  mesureId: 'cae_1.1.1',
  mesureType: ActionTypeEnum.ACTION,
  mesureNom:
    'Définir la vision, les objectifs et la stratégie Climat-Air-Énergie',
  // cast de mock : seuls les champs lus par le rendu du lien importent ici
} as unknown as MesureAuditStatut;

const renderMesureCell = () => {
  const original = mapToMatchReferentielTableRow(MESURE);
  const row = { original, subRows: [] } as unknown as Row<never>;
  return render(
    <CellAction
      {...({
        row,
        value: MESURE.mesureNom,
        collectiviteId: COLLECTIVITE_ID,
        referentielId: 'cae',
      } as unknown as TCellProps)}
    />
  );
};

describe('lien vers une mesure dans le suivi audit', () => {
  it("pointe vers l'action de la mesure, jamais vers /action/#undefined", () => {
    renderMesureCell();

    const href = screen.getByRole('link').getAttribute('href');

    expect(href).toEqual(
      `/collectivite/${COLLECTIVITE_ID}/referentiel/cae/action/cae_1.1.1?autoOpenPanel=1`
    );
  });
});
