import {
  ReferentielIdEnum,
  StatutAvancementEnum,
  type ActionScore,
} from '@tet/domain/referentiels';
import {
  buildSourceBlock,
  buildSourceBlockHeader,
  formatSourceScoreLabel,
  isExplicationNonVide,
  MERGE_COMMENTAIRES_BLOCK_SEPARATOR,
  MERGE_COMMENTAIRES_PREFIX,
  mergeCommentairesFromSources,
  sortMergeCommentaireSources,
  type MergeCommentaireSource,
} from './merge-commentaires.rules';

const baseActionScore = (
  overrides: Partial<ActionScore> = {}
): ActionScore => ({
  actionId: 'cae_1.2.3',
  pointReferentiel: 10,
  pointPotentiel: 10,
  pointPotentielPerso: null,
  pointFait: 0,
  pointProgramme: 0,
  pointPasFait: 0,
  pointNonRenseigne: 10,
  totalTachesCount: 1,
  completedTachesCount: 0,
  faitTachesAvancement: 0,
  programmeTachesAvancement: 0,
  pasFaitTachesAvancement: 0,
  pasConcerneTachesAvancement: 0,
  concerne: true,
  desactive: false,
  renseigne: false,
  ...overrides,
});

const source = (
  overrides: Partial<MergeCommentaireSource> = {}
): MergeCommentaireSource => ({
  referentielId: ReferentielIdEnum.CAE,
  origineActionId: 'cae_1.2.3',
  nom: 'Définir et mettre en oeuvre la stratégie',
  scoreLabel: '42 % FAIT',
  explication:
    '<p class="!text-base">Service Espace Conseil Rénovation : 16 personnes…</p>',
  ...overrides,
});

describe('merge-commentaires.rules', () => {
  describe('isExplicationNonVide', () => {
    it('rejette le HTML vide', () => {
      expect(isExplicationNonVide('<p></p>')).toBe(false);
      expect(isExplicationNonVide('<p>&nbsp;</p>')).toBe(false);
    });

    it('accepte le texte brut et le HTML avec contenu', () => {
      expect(isExplicationNonVide('ligne 1 du texte brut')).toBe(true);
      expect(isExplicationNonVide('<p>Contenu</p>')).toBe(true);
    });
  });

  describe('formatSourceScoreLabel', () => {
    it('retourne les libellés discrets en majuscules', () => {
      expect(
        formatSourceScoreLabel(
          baseActionScore({ avancement: StatutAvancementEnum.FAIT })
        )
      ).toBe('FAIT');
      expect(
        formatSourceScoreLabel(
          baseActionScore({ avancement: StatutAvancementEnum.PROGRAMME })
        )
      ).toBe('PROGRAMMÉ');
      expect(
        formatSourceScoreLabel(
          baseActionScore({ avancement: StatutAvancementEnum.PAS_FAIT })
        )
      ).toBe('PAS FAIT');
      expect(
        formatSourceScoreLabel(
          baseActionScore({ avancement: undefined, pointNonRenseigne: 10 })
        )
      ).toBe('NON RENSEIGNÉ');
    });

    it('retourne le pourcentage fait arrondi à l inférieur pour detaille', () => {
      expect(
        formatSourceScoreLabel(
          baseActionScore({
            avancement: StatutAvancementEnum.DETAILLE_AU_POURCENTAGE,
            pointFait: 4.2,
            pointPasFait: 5.8,
            pointNonRenseigne: 0,
          })
        )
      ).toBe('42 % FAIT');
    });
  });

  describe('buildSourceBlockHeader', () => {
    it("formate l'en-tête traçable", () => {
      expect(buildSourceBlockHeader(source())).toBe(
        '<p><strong>cae_1.2.3 - Définir et mettre en oeuvre la stratégie - 42 % FAIT</strong></p>'
      );
    });

    it('utilise une chaîne vide si nom est null', () => {
      expect(buildSourceBlockHeader(source({ nom: null }))).toBe(
        '<p><strong>cae_1.2.3 - 42 % FAIT</strong></p>'
      );
    });
  });

  describe('sortMergeCommentaireSources', () => {
    it('trie CAE avant ECI en conservant l ordre d entrée', () => {
      const eciFirst = source({
        referentielId: ReferentielIdEnum.ECI,
        origineActionId: 'eci_4.1',
        explication: 'ECI',
      });
      const caeSecond = source({
        referentielId: ReferentielIdEnum.CAE,
        origineActionId: 'cae_1.1',
        explication: 'CAE 2',
      });
      const caeFirst = source({
        referentielId: ReferentielIdEnum.CAE,
        origineActionId: 'cae_1.0',
        explication: 'CAE 1',
      });

      expect(
        sortMergeCommentaireSources([eciFirst, caeSecond, caeFirst]).map(
          (item) => item.origineActionId
        )
      ).toEqual(['cae_1.1', 'cae_1.0', 'eci_4.1']);
    });
  });

  describe('mergeCommentairesFromSources', () => {
    it('retourne null sans source avec texte', () => {
      expect(
        mergeCommentairesFromSources([
          source({ explication: '<p></p>' }),
          source({ explication: '   ' }),
        ])
      ).toBeNull();
    });

    it('concatène le préfixe, les blocs CAE puis ECI et conserve les corps', () => {
      const caeSource = source({
        scoreLabel: '42 % FAIT',
        explication:
          '<p class="!text-base !text-grey-8 font-[Marianne]">explications 1</p>',
      });
      const eciSource = source({
        referentielId: ReferentielIdEnum.ECI,
        origineActionId: 'eci_4.1',
        nom: 'Connaître les coûts',
        scoreLabel: 'FAIT',
        explication:
          'ligne 1 du texte brut hérité\nligne 2 du texte brut hérité',
      });

      const result = mergeCommentairesFromSources([eciSource, caeSource]);

      expect(result).toBe(
        `${MERGE_COMMENTAIRES_PREFIX}${buildSourceBlock(
          caeSource
        )}${MERGE_COMMENTAIRES_BLOCK_SEPARATOR}${buildSourceBlock(eciSource)}`
      );
    });

    it('ignore les sources sans texte non vide (annexe A — 1→1 sans texte)', () => {
      expect(
        mergeCommentairesFromSources([source({ explication: '<p>&nbsp;</p>' })])
      ).toBeNull();
    });
  });
});
