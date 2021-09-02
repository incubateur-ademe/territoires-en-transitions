import '@testing-library/jest-dom/extend-expect';
import {Console} from 'console';
import {FicheAction} from 'generated/models/fiche_action';
import {FicheActionCategorie} from 'generated/models/fiche_action_categorie';
import {compareIndexes} from 'utils';

import {categorizeAndSortFiches, sortFiches} from './sortFiches';

const makeCategorie = (uid: string, fiche_actions_uids: string[] = []) =>
  new FicheActionCategorie({
    epci_id: '',
    uid: uid,
    parent_uid: '',
    nom: '',
    fiche_actions_uids: fiche_actions_uids,
  });

const makeFicheAction = (custom_id: string, uid: string, titre?: string) => {
  return new FicheAction({
    epci_id: '',
    uid: uid,
    custom_id: custom_id,
    avancement: '',
    en_retard: false,
    referentiel_action_ids: [],
    referentiel_indicateur_ids: [],
    titre: titre ?? '',
    description: '',
    budget: 1,
    personne_referente: '',
    structure_pilote: '',
    partenaires: '',
    elu_referent: '',
    commentaire: '',
    date_debut: '',
    date_fin: '',
    indicateur_personnalise_ids: [],
  });
};

const defaultcategorie = makeCategorie('default');

describe('categorize fiches', () => {
  describe('when only one categorie and two fiches', () => {
    it('returns a list with categorized fiches', () => {
      const fiche_11A = makeFicheAction('1.1.A', '1.1.A');
      const fiche_11B = makeFicheAction('1.1.B', '1.1.B');
      const categorie1 = makeCategorie('categorie1', ['1.1.B', '1.1.A']);

      const categorizedFiches = categorizeAndSortFiches(
        [fiche_11B, fiche_11A],
        [categorie1],
        defaultcategorie
      );
      expect(categorizedFiches).toEqual([
        {categorie: categorie1, fiches: [fiche_11A, fiche_11B]},
      ]);
    });
    describe('when a fiche action is not categorized', () => {
      it("returns a list with a default 'unknown' categorie", () => {
        const fiche_withoutcategorie = makeFicheAction('1.1.A', '1.1.A');
        const categorizedFiches = categorizeAndSortFiches(
          [fiche_withoutcategorie],
          [],
          defaultcategorie
        );
        expect(categorizedFiches).toEqual([
          {
            categorie: defaultcategorie,
            fiches: [fiche_withoutcategorie],
          },
        ]);
      });
    });
  });
});

describe('compareIndexes', () => {
  it('sorts empty string after non empty strings', () => {
    expect(compareIndexes('', '1.1')).toEqual(1);
  });
});

describe('sort fiches', () => {
  it('sorts fiches without custom_id at the end and sorted by title', () => {
    const fiche_with_custom_id = makeFicheAction('1.1', 'Lala', 'Lala');
    const fiche_without_custom_id_A2 = makeFicheAction('', 'A2', 'A.2 - titre');
    const fiche_without_custom_id_A1 = makeFicheAction('', 'A1', 'A.1 - titre');
    expect(
      sortFiches([
        fiche_without_custom_id_A2,
        fiche_with_custom_id,
        fiche_without_custom_id_A1,
      ])
    ).toEqual([
      fiche_with_custom_id,
      fiche_without_custom_id_A1,
      fiche_without_custom_id_A2,
    ]);
  });
  it('sorts correctly when numbers are 1.9 and 1.10', () => {
    const fiche_9 = makeFicheAction('1.9', '1.9');
    const fiche_10 = makeFicheAction('1.10', '1.10');
    expect(sortFiches([fiche_10, fiche_9])).toEqual([fiche_9, fiche_10]);
  });
  it('sorts correctly when numbers are 1.1,  1.1.A and 1.1.B', () => {
    const fiche_11 = makeFicheAction('1.1', '1.1');
    const fiche_11A = makeFicheAction('1.1.A', '1.1.A');
    const fiche_11B = makeFicheAction('1.1.B', '1.1.B');
    expect(sortFiches([fiche_11, fiche_11B, fiche_11A])).toEqual([
      fiche_11,
      fiche_11A,
      fiche_11B,
    ]);
  });
});
