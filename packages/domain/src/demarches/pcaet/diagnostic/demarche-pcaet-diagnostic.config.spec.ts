import {
  ALL_PCAET_DIAGNOSTIC_INDICATEUR_IDS,
  listPcaetDiagnosticIndicateurRequiredLeaves,
  PCAET_DIAGNOSTIC_INDICATEURS,
  PCAET_DIAGNOSTIC_VULNERABILITE,
} from './demarche-pcaet-diagnostic.config';

describe('DEMARCHE_PCAET_DIAGNOSTIC_INDICATEURS', () => {
  it('expose les 5 topics indicateurs dans l’ordre réglementaire', () => {
    expect(PCAET_DIAGNOSTIC_INDICATEURS.map((topic) => topic.code)).toEqual([
      'emissions_ges',
      'polluants_atmospheriques',
      'sequestration',
      'consommation_energetique',
      'enr',
    ]);
  });

  it('porte le libellé Émissions GES pour le profil', () => {
    expect(
      PCAET_DIAGNOSTIC_INDICATEURS.find(
        (topic) => topic.code === 'emissions_ges'
      )?.label
    ).toBe('Émissions GES');
  });

  it('exige chaque ligne de la séquestration carbone, objectif 2050 compris', () => {
    const sequestration = PCAET_DIAGNOSTIC_INDICATEURS.find(
      (topic) => topic.code === 'sequestration'
    );
    expect(sequestration).toBeDefined();
    expect('optional' in (sequestration ?? {})).toBe(false);
    expect(
      sequestration &&
        listPcaetDiagnosticIndicateurRequiredLeaves(sequestration)
    ).toEqual([
      { indicateurDefinitionId: 'cae_63.b', optionalYears: [] },
      { indicateurDefinitionId: 'cae_63.c', optionalYears: [] },
      { indicateurDefinitionId: 'cae_63.e', optionalYears: [] },
    ]);
  });

  it('exige l’objectif 2050 sur toutes les lignes saisissables', () => {
    const leavesExcluant2050 = PCAET_DIAGNOSTIC_INDICATEURS.flatMap((topic) =>
      listPcaetDiagnosticIndicateurRequiredLeaves(topic)
    ).filter((leaf) => leaf.optionalYears.includes(2050));
    expect(leavesExcluant2050).toEqual([]);
  });

  it('liste des identifiants référentiel uniques', () => {
    const ids = ALL_PCAET_DIAGNOSTIC_INDICATEUR_IDS;
    expect(ids.length).toBeGreaterThan(85);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('DEMARCHE_PCAET_DIAGNOSTIC_VULNERABILITE', () => {
  it('définit le topic vulnérabilité hors grille indicateurs', () => {
    expect(PCAET_DIAGNOSTIC_VULNERABILITE).toEqual({
      code: 'vulnerabilite_territoire',
      label: 'Vulnérabilité du territoire',
      icon: 'map-2-line',
      horizons: [2050, 2100],
    });
  });
});
