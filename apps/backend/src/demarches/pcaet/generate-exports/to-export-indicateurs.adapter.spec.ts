import {
  ALL_PCAET_DIAGNOSTIC_INDICATEUR_IDS,
  PCAET_DIAGNOSTIC_INDICATEURS,
  type PcaetDiagnostic,
  type PcaetDiagnosticIndicateur,
  type PcaetDiagnosticIndicateurParentConfig,
} from '@tet/domain/demarches';
import type { IndicateurValeurAvecMetadonnesDefinition } from '@tet/domain/indicateurs';
import { describe, expect, it } from 'vitest';
import { toExportIndicateurs } from './to-export-indicateurs.adapter';

const makeDefinition = (
  id: number,
  identifiantReferentiel: string
): PcaetDiagnosticIndicateur =>
  ({
    id,
    identifiantReferentiel,
    titre: `Titre ${identifiantReferentiel}`,
    unite: 'kt',
  } as PcaetDiagnosticIndicateur);

const leaf = (indicateurDefinitionId: string) => ({
  label: indicateurDefinitionId,
  indicateurDefinitionId,
});

const GES: PcaetDiagnosticIndicateurParentConfig = {
  code: 'ges',
  label: 'GES',
  icon: 'fire-line',
  indicateurDefinitionId: 'ges',
  referenceYearApplyLevel: 'parent',
  children: [leaf('ges.a'), leaf('ges.b')],
};

const POLLUANTS: PcaetDiagnosticIndicateurParentConfig = {
  code: 'polluants',
  label: 'Polluants',
  icon: 'haze-2-line',
  // Volet sans définition propre, comme `emission_polluants_atmo`.
  indicateurDefinitionId: 'polluants',
  referenceYearApplyLevel: 'child',
  children: [
    { ...leaf('nox'), children: [leaf('nox.a'), leaf('nox.b')] },
    { ...leaf('pm10'), children: [leaf('pm10.a')] },
  ],
};

const definitions = [
  makeDefinition(1, 'ges'),
  makeDefinition(2, 'ges.a'),
  makeDefinition(3, 'ges.b'),
  makeDefinition(10, 'nox'),
  makeDefinition(11, 'nox.a'),
  makeDefinition(12, 'nox.b'),
  makeDefinition(20, 'pm10'),
  makeDefinition(21, 'pm10.a'),
];

const makeValeur = (indicateurId: number) =>
  ({
    indicateurValeur: {
      periodicite: 'annuelle',
      dateValeur: '2022-01-01',
      resultat: 1,
      objectif: null,
    },
    indicateurDefinition: { id: indicateurId, periodicite: 'annuelle' },
    indicateurSourceMetadonnee: {
      id: 7,
      sourceId: 'pcaet-collectivite',
      dateVersion: '2026-01-01',
    },
  } as unknown as IndicateurValeurAvecMetadonnesDefinition);

const makeDiagnostic = (
  configs: PcaetDiagnosticIndicateurParentConfig[],
  indicateurValeurs: IndicateurValeurAvecMetadonnesDefinition[] = []
) =>
  ({
    indicateurParentConfigs: configs,
    indicateurDefinitions: definitions,
    indicateurValeurs,
  } as unknown as PcaetDiagnostic);

describe('toExportIndicateurs', () => {
  it("suit l'ordre des volets, chaque ligne à sous-lignes devenant un parent", () => {
    const { parents } = toExportIndicateurs(makeDiagnostic([POLLUANTS, GES]));

    expect(
      parents.map((parent) => ({
        identifiant: parent.identifiantReferentiel,
        enfants: parent.enfants.map((e) => e.identifiantReferentiel),
      }))
    ).toEqual([
      { identifiant: 'nox', enfants: ['nox.a', 'nox.b'] },
      { identifiant: 'pm10', enfants: ['pm10.a'] },
      { identifiant: 'ges', enfants: ['ges.a', 'ges.b'] },
    ]);
    expect(parents[0]).toMatchObject({
      titre: 'Titre nox',
      unite: 'kt',
      pilotes: [],
      services: [],
      commentaire: null,
    });
  });

  it('exporte les lignes simples d’un volet sans définition comme des parents', () => {
    const sansRacine = {
      ...GES,
      indicateurDefinitionId: 'inconnu',
    };
    const { parents } = toExportIndicateurs(makeDiagnostic([sansRacine]));

    expect(parents.map((p) => p.identifiantReferentiel)).toEqual([
      'ges.a',
      'ges.b',
    ]);
  });

  it('retire la source des valeurs pour qu’elles tombent sur la ligne principale', () => {
    const { valeurs } = toExportIndicateurs(
      makeDiagnostic([GES], [makeValeur(2)])
    );

    expect(valeurs).toHaveLength(1);
    expect(valeurs[0].indicateurSourceMetadonnee).toBeNull();
    expect(valeurs[0].indicateurValeur.resultat).toBe(1);
  });

  it('exporte une fois chaque indicateur de la config réelle du diagnostic', () => {
    const { parents } = toExportIndicateurs({
      indicateurParentConfigs: PCAET_DIAGNOSTIC_INDICATEURS,
      indicateurDefinitions: ALL_PCAET_DIAGNOSTIC_INDICATEUR_IDS.map((id, i) =>
        makeDefinition(i + 1, id)
      ),
      indicateurValeurs: [],
    } as unknown as PcaetDiagnostic);

    const exportes = parents.flatMap((parent) => [
      parent.identifiantReferentiel,
      ...parent.enfants.map((enfant) => enfant.identifiantReferentiel),
    ]);
    expect([...exportes].sort()).toEqual(
      [...ALL_PCAET_DIAGNOSTIC_INDICATEUR_IDS].sort()
    );
  });
});
