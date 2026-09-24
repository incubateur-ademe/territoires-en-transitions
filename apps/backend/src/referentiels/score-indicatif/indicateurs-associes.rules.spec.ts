import { IndicateurPeriodiciteEnum } from '@tet/domain/indicateurs';
import { ReferencedIndicateur } from '@tet/backend/indicateurs/valeurs/referenced-indicateur.dto';
import { CollectiviteAvecType } from '@tet/domain/collectivites';
import {
  buildIndicateursAssocies,
  filterIndicateursByLocalisation,
} from './indicateurs-associes.rules';
import { IndicateurDefinitionAvecCategories } from './score-indicatif.repository';

const indicateurDom: IndicateurDefinitionAvecCategories = {
  indicateurId: 1,
  identifiantReferentiel: 'ind_dom',
  unite: '%',
  titre: 'Indicateur DOM',
  periodicite: IndicateurPeriodiciteEnum.ANNUELLE,
  categories: ['dom'],
  isApplicable: true,
};

const indicateurHorsDom: IndicateurDefinitionAvecCategories = {
  indicateurId: 2,
  identifiantReferentiel: 'ind_hors_dom',
  unite: '%',
  titre: 'Indicateur hors DOM',
  periodicite: IndicateurPeriodiciteEnum.ANNUELLE,
  categories: ['hors_dom'],
  isApplicable: true,
};

const indicateurNeutre: IndicateurDefinitionAvecCategories = {
  indicateurId: 3,
  identifiantReferentiel: 'ind_neutre',
  unite: '%',
  titre: 'Indicateur neutre',
  periodicite: IndicateurPeriodiciteEnum.ANNUELLE,
  categories: [],
  isApplicable: true,
};

describe('indicateurs-associes.rules', () => {
  describe('filterIndicateursByLocalisation', () => {
    it('exclut les indicateurs hors_dom pour une collectivité DROM', () => {
      const identiteCollectivite = {
        drom: true,
      } as unknown as CollectiviteAvecType;

      const result = filterIndicateursByLocalisation(
        [indicateurDom, indicateurHorsDom, indicateurNeutre],
        identiteCollectivite
      );

      expect(result.map((i) => i.identifiantReferentiel)).toEqual([
        'ind_dom',
        'ind_neutre',
      ]);
    });

    it('exclut les indicateurs dom pour une collectivité non-DROM', () => {
      const identiteCollectivite = {
        drom: false,
      } as unknown as CollectiviteAvecType;

      const result = filterIndicateursByLocalisation(
        [indicateurDom, indicateurHorsDom, indicateurNeutre],
        identiteCollectivite
      );

      expect(result.map((i) => i.identifiantReferentiel)).toEqual([
        'ind_hors_dom',
        'ind_neutre',
      ]);
    });
  });

  describe('buildIndicateursAssocies', () => {
    it('associe chaque indicateur trouvé à son action', () => {
      const ref: ReferencedIndicateur = {
        identifiant: 'ind_neutre',
        optional: false,
        tokens: [],
      };

      const { indicateursAssocies, identifiantsManquants } =
        buildIndicateursAssocies({ cae_1: [ref] }, [indicateurNeutre]);

      expect(identifiantsManquants).toEqual([]);
      expect(indicateursAssocies).toEqual([
        {
          actionId: 'cae_1',
          indicateurId: 3,
          unite: '%',
          titre: 'Indicateur neutre',
          periodicite: IndicateurPeriodiciteEnum.ANNUELLE,
          identifiantReferentiel: 'ind_neutre',
          optional: false,
          isApplicable: true,
        },
      ]);
    });

    it("signale les identifiants manquants sans planter l'association", () => {
      const ref: ReferencedIndicateur = {
        identifiant: 'ind_inconnu',
        optional: true,
        tokens: [],
      };

      const { indicateursAssocies, identifiantsManquants } =
        buildIndicateursAssocies({ cae_1: [ref] }, []);

      expect(indicateursAssocies).toEqual([]);
      expect(identifiantsManquants).toEqual([
        { actionId: 'cae_1', identifiant: 'ind_inconnu' },
      ]);
    });
  });
});
