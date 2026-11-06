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

  it('exige chaque puits de la séquestration carbone, sauf « Autres sols »', () => {
    const sequestration = PCAET_DIAGNOSTIC_INDICATEURS.find(
      (topic) => topic.code === 'sequestration'
    );
    expect(sequestration).toBeDefined();
    expect('optional' in (sequestration ?? {})).toBe(false);
    expect(
      sequestration &&
        listPcaetDiagnosticIndicateurRequiredLeaves(sequestration).map(
          (leaf) => leaf.indicateurDefinitionId
        )
    ).toEqual(['cae_63.b', 'cae_63.c', 'cae_63.e']);
  });

  it('n’exige pas le constat de référence pour la consommation d’ENR', () => {
    const referenceOptionalIds = PCAET_DIAGNOSTIC_INDICATEURS.flatMap((topic) =>
      listPcaetDiagnosticIndicateurRequiredLeaves(topic)
        .filter((leaf) => !leaf.isReferenceResultatRequired)
        .map((leaf) => leaf.indicateurDefinitionId)
    );
    expect(referenceOptionalIds).toEqual([
      'conso_ENR_biomasse',
      'conso_ENR_PAC',
      'conso_ENR_geothermie',
      'conso_ENR_solaire_th',
      'conso_ENR_biogaz',
      'conso_ENR_biocarburant',
    ]);
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
