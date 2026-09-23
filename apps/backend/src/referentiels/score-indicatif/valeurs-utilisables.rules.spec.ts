import { IndicateurAvecValeursParSource } from '@tet/domain/indicateurs';
import { IndicateurAssocie, ValeurUtilisee } from '@tet/domain/referentiels';
import {
  mapActionIdToValeurUtilisable,
  mapIndicateurToValeurUtilisable,
} from './valeurs-utilisables.rules';

const indicateurAssocie: IndicateurAssocie = {
  actionId: 'cae_1.1.1',
  indicateurId: 42,
  identifiantReferentiel: 'ind_test',
  titre: 'Indicateur de test',
  unite: '%',
  isApplicable: true,
};

function buildValeursGroupees(
  overrides: Partial<IndicateurAvecValeursParSource> = {}
): { indicateurs: IndicateurAvecValeursParSource[] } {
  return {
    indicateurs: [
      {
        definition: { id: 42 },
        totalValeursCount: 1,
        totalFilledValeursCount: 1,
        sources: {
          collectivite: {
            source: 'collectivite',
            metadonnees: [],
            ordreAffichage: null,
            libelle: 'Ma collectivité',
            valeurs: [
              {
                id: 1,
                collectiviteId: 1,
                dateValeur: '2023-01-01',
                resultat: 10,
                resultatCommentaire: null,
                objectif: 20,
                objectifCommentaire: null,
                metadonneeId: null,
                calculAuto: null,
                calculAutoIdentifiantsManquants: null,
              },
            ],
          },
        },
        ...overrides,
      } as unknown as IndicateurAvecValeursParSource,
    ],
  };
}

describe('valeurs-utilisables.rules', () => {
  describe('mapIndicateurToValeurUtilisable', () => {
    it("renvoie null quand l'indicateur n'a pas de valeurs groupées", () => {
      const result = mapIndicateurToValeurUtilisable(
        indicateurAssocie,
        { indicateurs: [] },
        []
      );
      expect(result).toBeNull();
    });

    it('marque la valeur utilisée dans la sélection "fait"', () => {
      const valeursUtilisees: ValeurUtilisee[] = [
        {
          actionId: indicateurAssocie.actionId,
          indicateurId: indicateurAssocie.indicateurId,
          indicateurValeurId: 1,
          valeur: 10,
          dateValeur: '2023-01-01',
          typeScore: 'fait',
          sourceLibelle: null,
          sourceMetadonnee: null,
        },
      ];

      const result = mapIndicateurToValeurUtilisable(
        indicateurAssocie,
        buildValeursGroupees(),
        valeursUtilisees
      );

      expect(result?.selection.fait).toEqual({
        id: 1,
        annee: 2023,
        source: 'collectivite',
        valeur: 10,
      });
      expect(result?.selection.programme).toBeNull();
      expect(result?.sources[0].fait[0].utilisee).toBe(true);
      // absence d'une entrée de type de score doit se comporter comme `false`
      expect(result?.sources[0].programme[0].utilisee).toBe(false);
    });
  });

  describe('mapActionIdToValeurUtilisable', () => {
    it("ne garde que les indicateurs associés à l'action demandée", () => {
      const autreIndicateur: IndicateurAssocie = {
        ...indicateurAssocie,
        actionId: 'cae_1.1.2',
        indicateurId: 99,
      };

      const result = mapActionIdToValeurUtilisable(
        indicateurAssocie.actionId,
        [indicateurAssocie, autreIndicateur],
        buildValeursGroupees(),
        {}
      );

      expect(result.actionId).toBe(indicateurAssocie.actionId);
      expect(result.indicateurs).toHaveLength(1);
      expect(result.indicateurs[0].indicateurId).toBe(
        indicateurAssocie.indicateurId
      );
    });

    it('exclut les indicateurs sans valeurs groupées correspondantes', () => {
      const result = mapActionIdToValeurUtilisable(
        indicateurAssocie.actionId,
        [indicateurAssocie],
        { indicateurs: [] },
        {}
      );

      expect(result.indicateurs).toHaveLength(0);
    });
  });
});
