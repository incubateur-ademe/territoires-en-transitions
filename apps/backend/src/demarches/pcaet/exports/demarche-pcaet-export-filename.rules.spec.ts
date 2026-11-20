import { buildDemarchePcaetExportFilename } from './demarche-pcaet-export-filename.rules';

describe('buildDemarchePcaetExportFilename', () => {
  // 23 h 30 UTC le 15 : déjà le 16 à Paris.
  const date = new Date('2026-11-15T23:30:00Z');

  it("nomme l'export figé de la transmission, sans accents, à la date civile française", () => {
    expect(
      buildDemarchePcaetExportFilename({
        collectiviteNom: 'CA du Pays de Gex Agglomération',
        type: 'plan',
        transition: 'transmettre_pour_avis',
        date,
      })
    ).toBe(
      'PCAET_CA du Pays de Gex Agglomeration_Plan_transmis-pour-avis_2026-11-16.xlsx'
    );
  });

  it('donne le même nom aux deux variantes du plan', () => {
    const input = {
      collectiviteNom: 'Métropole',
      transition: 'publier',
      date,
    } as const;
    expect(
      buildDemarchePcaetExportFilename({ ...input, type: 'plan_expurge' })
    ).toBe(buildDemarchePcaetExportFilename({ ...input, type: 'plan' }));
    expect(buildDemarchePcaetExportFilename({ ...input, type: 'plan' })).toBe(
      'PCAET_Metropole_Plan_publie_2026-11-16.xlsx'
    );
  });

  it('ne porte que la date pour un export du jour, et remplace les caractères interdits dans un nom de fichier', () => {
    expect(
      buildDemarchePcaetExportFilename({
        collectiviteNom: 'Syndicat Loire/Allier : "SLA"',
        type: 'indicateurs',
        date,
      })
    ).toBe('PCAET_Syndicat Loire-Allier - -SLA-_Indicateurs_2026-11-16.xlsx');
  });
});
