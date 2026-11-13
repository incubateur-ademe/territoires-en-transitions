import { describe, expect, it } from 'vitest';
import type {
  CollectiviteCouverteRow,
  DossierInstructionRow,
} from '../list-dossiers-instruction/list-dossiers-instruction.repository';
import { buildCollectivitesSuivies } from './list-collectivites-suivies.rules';

const row = (
  collectiviteId: number,
  collectiviteNom: string,
  demarcheId: number | null
) =>
  ({
    demarcheId,
    collectiviteId,
    collectiviteNom,
    collectiviteDepartementCode: '31',
    collectiviteDepartementLibelle: 'Haute-Garonne',
    collectiviteRegionCode: '76',
    collectiviteRegionLibelle: 'Occitanie',
  } as DossierInstructionRow);

const couverte = (id: number, nom: string): CollectiviteCouverteRow => ({
  id,
  nom,
  departementCode: '11',
  departementLibelle: 'Aude',
  regionCode: '76',
  regionLibelle: 'Occitanie',
  natureInsee: 'CC',
  population: 20000,
});

describe('buildCollectivitesSuivies', () => {
  it('rattache l’EPCI couvert à son Supra, même quand ses propres lignes arrivent avant', () => {
    const couvertes = new Map([
      [10, [couverte(3, 'CC Lauragais Revel Sorezois')]],
    ]);
    const ordres = [
      [
        row(3, 'CC Lauragais Revel Sorezois', 5),
        row(1, 'PETR du Pays Lauragais', 10),
      ],
      [
        row(1, 'PETR du Pays Lauragais', 10),
        row(3, 'CC Lauragais Revel Sorezois', 5),
      ],
    ];
    for (const rows of ordres) {
      expect(
        buildCollectivitesSuivies(rows, couvertes).find(({ id }) => id === 3)
          ?.porteur
      ).toEqual({ id: 1, nom: 'PETR du Pays Lauragais' });
    }
  });

  it('liste une fois la collectivité qui porte plusieurs dossiers', () => {
    const suivies = buildCollectivitesSuivies(
      [row(1, 'CA du Sicoval', 10), row(1, 'CA du Sicoval', 11)],
      new Map()
    );
    expect(suivies.map(({ id }) => id)).toEqual([1]);
  });

  it('liste les EPCI couverts, rattachés à leur Supra, par ordre alphabétique', () => {
    const suivies = buildCollectivitesSuivies(
      [row(1, 'PETR du Pays Lauragais', 10), row(2, 'CA du Sicoval', null)],
      new Map([[10, [couverte(3, 'CC Castelnaudary Lauragais Audois')]]])
    );
    expect(suivies).toMatchObject([
      { id: 2, nom: 'CA du Sicoval', porteur: null, isSupra: false },
      {
        id: 3,
        departementCode: '11',
        porteur: { id: 1, nom: 'PETR du Pays Lauragais' },
        isSupra: false,
      },
      { id: 1, porteur: null, isSupra: true },
    ]);
  });

  it('reconnaît le Supra même quand son dossier couvrant n’est pas le premier', () => {
    const suivies = buildCollectivitesSuivies(
      [
        row(1, 'PETR du Pays Lauragais', 9),
        row(1, 'PETR du Pays Lauragais', 10),
      ],
      new Map([[10, [couverte(3, 'CC Lauragais Revel Sorezois')]]])
    );
    expect(suivies.find(({ id }) => id === 1)?.isSupra).toBe(true);
  });
});
