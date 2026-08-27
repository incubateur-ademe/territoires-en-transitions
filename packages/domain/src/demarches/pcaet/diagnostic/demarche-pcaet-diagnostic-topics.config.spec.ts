import {
  DEMARCHE_PCAET_DIAGNOSTIC_TOPICS,
  listDemarchePcaetDiagnosticReferentielIds,
} from './demarche-pcaet-diagnostic-topics.config';

describe('DEMARCHE_PCAET_DIAGNOSTIC_TOPICS', () => {
  it('expose les 6 topics dans l’ordre réglementaire', () => {
    expect(DEMARCHE_PCAET_DIAGNOSTIC_TOPICS.map((topic) => topic.code)).toEqual(
      [
        'profil_energie_climat',
        'polluants_atmospheriques',
        'sequestration',
        'consommation_energetique',
        'enr',
        'vulnerabilite_territoire',
      ]
    );
  });

  it('porte le libellé Émissions GES pour le profil', () => {
    expect(
      DEMARCHE_PCAET_DIAGNOSTIC_TOPICS.find(
        (topic) => topic.code === 'profil_energie_climat'
      )?.label
    ).toBe('Émissions GES');
  });

  it('limite la profondeur des lignes à deux niveaux', () => {
    for (const topic of DEMARCHE_PCAET_DIAGNOSTIC_TOPICS) {
      for (const row of topic.rows) {
        for (const child of row.rows) {
          expect(child).not.toHaveProperty('rows');
        }
      }
    }
  });

  it('compte 100 lignes de saisie', () => {
    const rowCount = DEMARCHE_PCAET_DIAGNOSTIC_TOPICS.reduce((count, topic) => {
      if (topic.kind !== 'indicateurs') {
        return count;
      }
      return (
        count +
        topic.rows.reduce((inner, row) => inner + 1 + row.rows.length, 0)
      );
    }, 0);
    expect(rowCount).toBe(100);
  });

  it('liste des identifiants référentiel uniques', () => {
    const ids = listDemarchePcaetDiagnosticReferentielIds();
    expect(ids.length).toBeGreaterThan(90);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
