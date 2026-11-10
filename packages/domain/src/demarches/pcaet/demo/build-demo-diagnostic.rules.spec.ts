import { describe, expect, it } from 'vitest';
import {
  ALL_PCAET_DIAGNOSTIC_INDICATEUR_IDS,
  PCAET_DIAGNOSTIC_INDICATEURS,
  PCAET_DIAGNOSTIC_VULNERABILITE,
} from '../diagnostic/demarche-pcaet-diagnostic.config';
import { isDemarchePcaetDiagnosticComplet } from '../diagnostic/demarche-pcaet-diagnostic.rules';
import type { PcaetDiagnostic } from '../diagnostic/demarche-pcaet-diagnostic.schema';
import { buildDemoDiagnostic } from './build-demo-diagnostic.rules';

const definitions = ALL_PCAET_DIAGNOSTIC_INDICATEUR_IDS.map(
  (identifiantReferentiel, index) =>
    ({
      id: index + 1,
      identifiantReferentiel,
      isApplicable: true,
    } as PcaetDiagnostic['indicateurDefinitions'][number])
);

const thematiques = [1, 2, 3].map((id) => ({
  id,
  code: `socle_${id}`,
  label: `Thématique ${id}`,
  parentId: null,
  requis: true,
  isSocle: true,
}));

const diagnosticVide = (): PcaetDiagnostic => ({
  indicateurParentConfigs: PCAET_DIAGNOSTIC_INDICATEURS,
  indicateurDefinitions: definitions,
  indicateurValeurs: [],
  vulnerabilite: {
    ...PCAET_DIAGNOSTIC_VULNERABILITE,
    horizons: [...PCAET_DIAGNOSTIC_VULNERABILITE.horizons],
    thematiques,
    lignes: [],
  },
});

/** Ce que la base renverrait après l'écriture des valeurs de démo. */
const applyDemo = (
  diagnostic: PcaetDiagnostic,
  currentYear: number
): PcaetDiagnostic => {
  const demo = buildDemoDiagnostic(diagnostic, currentYear);
  const identifiantById = new Map(
    definitions.map((definition) => [
      definition.id,
      definition.identifiantReferentiel,
    ])
  );
  return {
    ...diagnostic,
    indicateurValeurs: demo.valeurs.map(
      (valeur) =>
        ({
          indicateurValeur: {
            indicateurId: valeur.indicateurId,
            dateValeur: `${valeur.year}-01-01`,
            periodicite: 'annuelle',
            resultat: valeur.field === 'resultat' ? valeur.value : null,
            objectif: valeur.field === 'objectif' ? valeur.value : null,
          },
          indicateurDefinition: {
            identifiantReferentiel: identifiantById.get(valeur.indicateurId),
            periodicite: 'annuelle',
          },
        } as PcaetDiagnostic['indicateurValeurs'][number])
    ),
    vulnerabilite: { ...diagnostic.vulnerabilite, lignes: demo.vulnerabilite },
  };
};

describe('diagnostic de démonstration', () => {
  it('rend le diagnostic complet selon les règles réelles', () => {
    expect(isDemarchePcaetDiagnosticComplet(diagnosticVide())).toBe(false);
    expect(
      isDemarchePcaetDiagnosticComplet(applyDemo(diagnosticVide(), 2026))
    ).toBe(true);
  });

  it('pose le constat sur l’année courante', () => {
    const { valeurs } = buildDemoDiagnostic(diagnosticVide(), 2026);
    const years = new Set(
      valeurs.filter((v) => v.field === 'resultat').map((v) => v.year)
    );
    expect([...years]).toEqual([2026]);
  });

  it('recule d’un an quand l’année courante est un horizon d’objectif', () => {
    const { valeurs } = buildDemoDiagnostic(diagnosticVide(), 2030);
    const years = new Set(
      valeurs.filter((v) => v.field === 'resultat').map((v) => v.year)
    );
    expect([...years]).toEqual([2029]);
  });

  it('fait baisser les émissions et monter les EnR', () => {
    const { valeurs } = buildDemoDiagnostic(diagnosticVide(), 2026);
    const serie = (identifiant: string) => {
      const id = definitions.find(
        (d) => d.identifiantReferentiel === identifiant
      )?.id;
      return valeurs
        .filter((v) => v.indicateurId === id)
        .sort((a, b) => a.year - b.year)
        .map((v) => v.value);
    };
    const ges = serie('cae_1.c');
    expect(ges[3]).toBeLessThan(ges[0]);
    const enr = serie('cae_3.ad');
    expect(enr[3]).toBeGreaterThan(enr[0]);
  });

  it('donne des ordres de grandeur distincts aux lignes voisines', () => {
    const { valeurs } = buildDemoDiagnostic(diagnosticVide(), 2026);
    const references = valeurs
      .filter((v) => v.field === 'resultat')
      .map((v) => v.value);
    expect(new Set(references).size).toBeGreaterThan(references.length / 2);
  });

  it('est stable d’un remplissage à l’autre', () => {
    expect(buildDemoDiagnostic(diagnosticVide(), 2026)).toEqual(
      buildDemoDiagnostic(diagnosticVide(), 2026)
    );
  });
});
