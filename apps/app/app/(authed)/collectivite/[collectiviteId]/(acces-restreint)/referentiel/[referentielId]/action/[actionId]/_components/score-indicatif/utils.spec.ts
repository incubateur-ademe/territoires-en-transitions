import { IndicateurPeriodiciteEnum } from '@tet/domain/indicateurs';
import type { ScoreIndicatifValeurUtilisee } from './score-indicatif.types';
import { texteValeurUtilisee } from './utils';

const valeurUtilisee: ScoreIndicatifValeurUtilisee = {
  indicateurId: 42,
  valeur: 0,
  dateValeur: '2025-07-10',
  sourceLibelle: 'CITEPA',
  sourceMetadonnee: null,
};

describe('texteValeurUtilisee', () => {
  it.each(['2025-01-01', '2025-07-10', '2025-12-31'])(
    'affiche une observation annuelle courante ou historique datée du %s',
    (dateValeur) => {
      expect(
        texteValeurUtilisee({
          valeurUtilisee: { ...valeurUtilisee, dateValeur },
          periodicite: IndicateurPeriodiciteEnum.ANNUELLE,
          unite: 't',
          typeScore: 'fait',
        })
      ).toEqual({
        valeurEtUnite: '0 t',
        annee: 'en 2025',
        source: ' (source : CITEPA)',
      });
    }
  );

  it('conserve le masquage de l’année et de la source des snapshots', () => {
    expect(
      texteValeurUtilisee({
        valeurUtilisee,
        periodicite: IndicateurPeriodiciteEnum.ANNUELLE,
        unite: 't',
        typeScore: 'programme',
        noYear: true,
        noSource: true,
      })
    ).toEqual({ valeurEtUnite: '0 t', annee: '', source: '' });
  });

  it('refuse de présenter une observation mensuelle comme annuelle', () => {
    expect(() =>
      texteValeurUtilisee({
        valeurUtilisee,
        periodicite: IndicateurPeriodiciteEnum.MENSUELLE,
        unite: 't',
        typeScore: 'fait',
      })
    ).toThrow();
  });
});
