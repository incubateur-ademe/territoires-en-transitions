import {
  ALL_PCAET_DIAGNOSTIC_INDICATEUR_IDS,
  buildPcaetDiagnosticIndicateurTables,
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
  label: `Libellé ${indicateurDefinitionId}`,
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
  indicateurValeurs: IndicateurValeurAvecMetadonnesDefinition[] = [],
  indicateurDefinitions: PcaetDiagnosticIndicateur[] = definitions
) =>
  ({
    indicateurParentConfigs: configs,
    indicateurDefinitions,
    indicateurValeurs,
  } as unknown as PcaetDiagnostic);

const realDiagnostic = {
  indicateurParentConfigs: PCAET_DIAGNOSTIC_INDICATEURS,
  indicateurDefinitions: ALL_PCAET_DIAGNOSTIC_INDICATEUR_IDS.map((id, i) =>
    makeDefinition(i + 1, id)
  ),
  indicateurValeurs: [],
} as unknown as PcaetDiagnostic;

const lignes = (
  parents: { identifiantReferentiel: string | null; categorie?: string }[]
) => parents.map((parent) => [parent.identifiantReferentiel, parent.categorie]);

describe('toExportIndicateurs', () => {
  it("suit l'ordre des tables de l'écran, chaque ligne rangée sous leurs titres", () => {
    const { parents } = toExportIndicateurs(makeDiagnostic([POLLUANTS, GES]));

    expect(lignes(parents)).toEqual([
      ['nox.a', 'Polluants – Libellé nox'],
      ['nox.b', 'Polluants – Libellé nox'],
      ['pm10.a', 'Polluants – Libellé pm10'],
      ['ges.a', 'GES'],
      ['ges.b', 'GES'],
    ]);
    expect(parents[0]).toMatchObject({
      titre: 'Libellé nox.a',
      unite: 'kt',
      pilotes: [],
      services: [],
      commentaire: null,
      enfants: [],
    });
  });

  it("n'exporte ni les agrégats, absents de l'écran, ni leurs valeurs", () => {
    const { parents, valeurs } = toExportIndicateurs(
      makeDiagnostic(
        [POLLUANTS, GES],
        [makeValeur(10), makeValeur(1), makeValeur(2)]
      )
    );

    expect(parents.map((parent) => parent.identifiantReferentiel)).toEqual([
      'nox.a',
      'nox.b',
      'pm10.a',
      'ges.a',
      'ges.b',
    ]);
    expect(valeurs.map((valeur) => valeur.indicateurDefinition?.id)).toEqual([
      2,
    ]);
  });

  it('range les lignes du volet ENR sous leur section et leur groupe', () => {
    const { parents } = toExportIndicateurs(realDiagnostic);
    const categories = new Map(lignes(parents).map(([id, c]) => [id, c]));

    expect(categories.has('cae_3.a')).toBe(false);
    expect(categories.get('cae_3.ad')).toBe(
      "Énergies renouvelables – Production d'énergie – Électricité"
    );
    expect(categories.get('conso_ENR_biomasse')).toBe(
      "Énergies renouvelables – Consommation d'énergie – Chaleur"
    );
    expect(categories.get('conso_ENR_biocarburant')).toBe(
      "Énergies renouvelables – Consommation d'énergie – Autres"
    );
    expect(categories.get('pcaet_valo_stockage')).toBe(
      "Énergies renouvelables – Valorisation des potentiels d'énergie – Récupération et stockage"
    );
  });

  it('signale dans son libellé un indicateur déclaré non applicable', () => {
    const { parents } = toExportIndicateurs(
      makeDiagnostic(
        [GES],
        [],
        definitions.map((definition) => ({
          ...definition,
          isApplicable: definition.identifiantReferentiel !== 'ges.b',
        }))
      )
    );

    expect(parents.map((parent) => parent.titre)).toEqual([
      'Libellé ges.a',
      'Libellé ges.b (non applicable)',
    ]);
  });

  it("n'exporte pas les valeurs d'un indicateur non applicable, mais garde sa ligne", () => {
    const { parents, valeurs } = toExportIndicateurs(
      makeDiagnostic(
        [GES],
        [makeValeur(2), makeValeur(3)],
        definitions.map((definition) => ({
          ...definition,
          isApplicable: definition.identifiantReferentiel !== 'ges.b',
        }))
      )
    );

    expect(lignes(parents)).toEqual([
      ['ges.a', 'GES'],
      ['ges.b', 'GES'],
    ]);
    expect(valeurs.map((valeur) => valeur.indicateurDefinition?.id)).toEqual([
      2,
    ]);
  });

  it("ignore une ligne dont la définition n'est pas servie", () => {
    const { parents } = toExportIndicateurs(
      makeDiagnostic([{ ...GES, children: [leaf('inconnu'), leaf('ges.b')] }])
    );

    expect(lignes(parents)).toEqual([['ges.b', 'GES']]);
  });

  it('retire la source des valeurs pour qu’elles tombent sur la ligne principale', () => {
    const { valeurs } = toExportIndicateurs(
      makeDiagnostic([GES], [makeValeur(2)])
    );

    expect(valeurs).toHaveLength(1);
    expect(valeurs[0].indicateurSourceMetadonnee).toBeNull();
    expect(valeurs[0].indicateurValeur.resultat).toBe(1);
  });

  it("exporte une fois chaque ligne saisissable de la config réelle, dans l'ordre de l'écran", () => {
    const { parents } = toExportIndicateurs(realDiagnostic);

    expect(parents.map((parent) => parent.identifiantReferentiel)).toEqual(
      PCAET_DIAGNOSTIC_INDICATEURS.flatMap(buildPcaetDiagnosticIndicateurTables)
        .flatMap((table) => table.rows)
        .map((row) => row.indicateurDefinitionId)
    );
  });
});
