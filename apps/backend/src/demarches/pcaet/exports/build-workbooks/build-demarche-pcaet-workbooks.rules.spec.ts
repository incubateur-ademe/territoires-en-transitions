import type { PcaetDiagnostic } from '@tet/domain/demarches';
import { hasPcaetDiagnosticData } from './build-demarche-pcaet-workbooks.rules';

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
