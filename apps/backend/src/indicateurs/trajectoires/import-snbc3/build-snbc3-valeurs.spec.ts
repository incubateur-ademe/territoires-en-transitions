import { readFileSync } from 'fs';
import { join } from 'path';
import {
  buildSnbc3Valeurs,
  Snbc3Row,
  Snbc3Territoire,
  Snbc3Valeur,
} from './build-snbc3-valeurs';
import {
  SNBC3_IGNORED,
  SNBC3_IMPORTED_IDENTIFIANTS,
  SNBC3_MAPPING,
} from './snbc3-mapping';

const row = (
  code: string,
  valeur: number | null,
  qualite = 'ok',
  annee = 2021
): Snbc3Row => ({ code, annee, valeur, qualite });

const territoire = (rows: Snbc3Row[], zone = 'HEXAGONE'): Snbc3Territoire => ({
  code: '200000172',
  niveauGeo: 'EPCI',
  zone,
  rows,
});

const build = (rows: Snbc3Row[], zone?: string): Snbc3Valeur[] => {
  const result = buildSnbc3Valeurs(territoire(rows, zone));
  if (!result.success) throw new Error(JSON.stringify(result.error));
  return result.data;
};

const findValeur = (
  valeurs: Snbc3Valeur[],
  identifiant: string,
  annee = 2021
) => valeurs.find((v) => v.identifiant === identifiant && v.annee === annee);

describe('buildSnbc3Valeurs', () => {
  test('somme les codes d’un même indicateur, en kteq CO2 ou en GWh', () => {
    const valeurs = build([
      row('emi_agr_elev_bovins', 0.1),
      row('emi_agr_elev_porcins', 0.02),
      row('emi_agr_elev_volailles', 0.003),
      row('emi_agr_elev_autres', 0.0004),
      row('emi_mob_vp_domtra', 0.01),
      row('emi_mob_vp_2roues', 0.002),
      row('emi_mob_vp_bus', 0.003),
      row('emi_mob_vp_autre', 0.04),
      row('emi_fret_vul', 0.005),
      row('emi_fret_pl', 0.006),
      row('emi_res_autres', 0.001),
      row('emi_res_clim', 0.002),
      row('emi_ter_autres', 0.003),
      row('emi_ter_clim', 0.004),
      row('cons_ind_ind_autres', 0.07),
      row('cons_csc', 0.008),
    ]);

    expect(findValeur(valeurs, 'cae_1.gb')?.objectif).toBeCloseTo(123.4);
    expect(findValeur(valeurs, 'cae_1.ea')?.objectif).toBeCloseTo(15);
    expect(findValeur(valeurs, 'cae_1.eb')?.objectif).toBeCloseTo(51);
    expect(findValeur(valeurs, 'cae_1.cc')?.objectif).toBeCloseTo(3);
    expect(findValeur(valeurs, 'cae_1.db')?.objectif).toBeCloseTo(7);
    expect(findValeur(valeurs, 'cae_2.kg')?.objectif).toBeCloseTo(78);
  });

  test('inverse le signe de la séquestration et du captage', () => {
    const valeurs = build([
      row('emi_UTCATF_for', -0.5),
      row('emi_UTCATF_solfor', -0.1, 'pass_through_sans_recalage'),
      row('emi_UTCATF_cult', 0.02),
      row('emi_CSC_beccs_en', -0.01, 'pass_through_sans_recalage'),
      row('emi_CSC_dac', -0.002, 'pass_through_sans_recalage'),
    ]);

    expect(findValeur(valeurs, 'cae_63.b')?.objectif).toBeCloseTo(600);
    // Émission nette des cultures : séquestration négative.
    expect(findValeur(valeurs, 'cae_63.ca')?.objectif).toBeCloseTo(-20);
    expect(findValeur(valeurs, 'cae_1.csc')?.objectif).toBeCloseTo(12);
  });

  test('laisse vide une valeur inconnue, sans la convertir en 0', () => {
    const valeurs = build([
      row('emi_dech', null, 'pivot_absent'),
      row('emi_dech', Number.NaN, 'pivot_absent', 2022),
      row('emi_fret_vul', 0.001),
      row('emi_fret_pl', null, 'pivot_absent'),
    ]);

    expect(findValeur(valeurs, 'cae_1.h')).toBeUndefined();
    expect(findValeur(valeurs, 'cae_1.h', 2022)).toBeUndefined();
    expect(findValeur(valeurs, 'cae_1.eb')?.objectif).toBeCloseTo(1);
  });

  test('omet cae_2.g pour une année sans cons_mob_vp_autre', () => {
    const valeurs = build([
      row('cons_mob_vp_domtra', 0.1, 'ok', 2021),
      row('cons_mob_vp_autre', 0.2, 'ok', 2021),
      row('cons_mob_vp_domtra', 0.1, 'ok', 2022),
      row('cons_mob_vp_autre', null, 'pivot_absent', 2022),
    ]);

    expect(findValeur(valeurs, 'cae_2.g', 2021)?.objectif).toBeCloseTo(300);
    expect(findValeur(valeurs, 'cae_2.g', 2022)).toBeUndefined();
  });

  test('calcule cae_1.aa dans l’Hexagone seulement, hors codes ignorés', () => {
    const rows = [
      row('emi_res_ch_MI', 0.1),
      row('emi_UTCATF_for', -0.03, 'pass_through_sans_recalage'),
      row('emi_UTCATF_bar', 5),
      row('emi_UTCATF_aut', 7),
      row('emi_CSC_dac', -0.001, 'pass_through_sans_recalage'),
      row('cons_res_ch_MI', 9),
    ];

    const hexagone = build(rows);
    expect(findValeur(hexagone, 'cae_1.aa')?.objectif).toBeCloseTo(69);

    const drom = build(rows, 'REUNION');
    expect(findValeur(drom, 'cae_1.aa')).toBeUndefined();
    expect(findValeur(drom, 'cae_1.ca')?.objectif).toBeCloseTo(100);
  });

  test('n’importe pas les codes ignorés', () => {
    const valeurs = build([row('emi_UTCATF_bar', 5), row('emi_UTCATF_aut', 7)]);
    expect(valeurs.filter((v) => v.identifiant !== 'cae_1.aa')).toEqual([]);
  });

  test('rejette un code inconnu', () => {
    const result = buildSnbc3Valeurs(
      territoire([row('emi_res_ch_MI', 0.1), row('emi_nouveau', 0.1)])
    );
    expect(result).toEqual({
      success: false,
      error: { error: 'UNKNOWN_SNBC3_CODE', codes: ['emi_nouveau'] },
    });
  });

  test('commente le recalage et les indicateurs manquants', () => {
    const valeurs = build([
      row('emi_res_ch_MI', 0.1),
      row('emi_CSC_dac', -0.001, 'pass_through_sans_recalage'),
      row('emi_en', null, 'pivot_absent'),
      row('cons_dech', null, 'pivot_absent'),
    ]);
    const missing = ' - Indicateurs manquants : cae_1.j, cae_2.j';

    expect(findValeur(valeurs, 'cae_1.ca')?.objectifCommentaire).toBe(
      `Trajectoire SNBC 3 recalée sur OREC 2021${missing}`
    );
    expect(findValeur(valeurs, 'cae_1.csc')?.objectifCommentaire).toBe(
      `Trajectoire SNBC 3 non recalée${missing}`
    );
    expect(findValeur(valeurs, 'cae_1.aa')?.objectifCommentaire).toBe(
      `Trajectoire SNBC 3 partiellement recalée sur OREC 2021${missing}`
    );

    const drom = build([row('emi_res_ch_MI', 0.1)], 'GUADELOUPE');
    expect(findValeur(drom, 'cae_1.ca')?.objectifCommentaire).toBe(
      'Trajectoire SNBC 3 recalée sur CITEPA IGT 2021'
    );
  });

  describe('correspondance', () => {
    test('couvre les 66 codes de la release V2.1', () => {
      expect(Object.keys(SNBC3_MAPPING)).toHaveLength(66);
      expect(
        Object.entries(SNBC3_MAPPING)
          .filter(([, target]) => target === SNBC3_IGNORED)
          .map(([code]) => code)
          .sort()
      ).toEqual(['emi_UTCATF_aut', 'emi_UTCATF_bar']);
    });

    test('ne cible que des indicateurs du catalogue, sans formule', () => {
      const csv = readFileSync(
        join(
          __dirname,
          '../../import-indicateurs/samples/import-indicateur-definitions.csv'
        ),
        'utf-8'
      );
      const formulas = new Map(
        [...csv.matchAll(/^(cae_[\w.]+),(.*)$/gm)].map(([, id, rest]) => [
          id,
          rest,
        ])
      );

      for (const identifiant of SNBC3_IMPORTED_IDENTIFIANTS) {
        expect(formulas.has(identifiant), identifiant).toBe(true);
        expect(formulas.get(identifiant), identifiant).not.toMatch(/val\(/);
      }
      expect(SNBC3_IMPORTED_IDENTIFIANTS).not.toContain('cae_2.l_pcaet');
      expect(SNBC3_IMPORTED_IDENTIFIANTS).not.toContain('cae_63.cc');
      expect(SNBC3_IMPORTED_IDENTIFIANTS).not.toContain('cae_63.cd');
    });
  });
});
