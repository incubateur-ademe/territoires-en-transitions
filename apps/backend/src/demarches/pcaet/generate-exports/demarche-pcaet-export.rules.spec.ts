import type { PcaetDiagnostic } from '@tet/domain/demarches';
import {
  buildDemarchePcaetExportFilename,
  hasPcaetDiagnosticData,
} from './demarche-pcaet-export.rules';

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

describe('hasPcaetDiagnosticData', () => {
  const ligneVierge = {
    thematiqueId: 1,
    niveauMaintenant: null,
    niveau2050: null,
    niveau2100: null,
    objectifs2050: null,
    objectifs2100: null,
  };
  const diagnostic = (
    overrides: {
      valeurs?: { resultat: number | null; objectif: number | null }[];
      lignes?: (typeof ligneVierge | Record<string, unknown>)[];
    } = {}
  ) =>
    ({
      indicateurValeurs: (overrides.valeurs ?? []).map((indicateurValeur) => ({
        indicateurValeur,
      })),
      vulnerabilite: { lignes: overrides.lignes ?? [ligneVierge] },
    } as unknown as PcaetDiagnostic);

  it('est faux sans valeur, même si chaque thématique a sa ligne vierge', () => {
    expect(hasPcaetDiagnosticData(diagnostic())).toBe(false);
    expect(
      hasPcaetDiagnosticData(
        diagnostic({
          valeurs: [{ resultat: null, objectif: null }],
          lignes: [{ ...ligneVierge, objectifs2050: '  ' }],
        })
      )
    ).toBe(false);
  });

  it("est vrai dès une valeur d'indicateur", () => {
    expect(
      hasPcaetDiagnosticData(
        diagnostic({ valeurs: [{ resultat: null, objectif: 12 }] })
      )
    ).toBe(true);
  });

  it('est vrai dès un niveau ou un objectif de vulnérabilité', () => {
    expect(
      hasPcaetDiagnosticData(
        diagnostic({
          lignes: [{ ...ligneVierge, niveau2050: 'non_concerne' }],
        })
      )
    ).toBe(true);
    expect(
      hasPcaetDiagnosticData(
        diagnostic({
          lignes: [{ ...ligneVierge, objectifs2100: 'Désimperméabiliser' }],
        })
      )
    ).toBe(true);
  });
});
