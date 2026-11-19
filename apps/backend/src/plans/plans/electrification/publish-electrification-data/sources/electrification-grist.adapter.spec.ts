import type { PublishedIndicateurReference } from '@tet/backend/indicateurs/indicateur/indicateur-reference-externe.repository';
import type { ElectrificationConfig } from '@tet/domain/plans';
import { describe, expect, it } from 'vitest';
import assert from 'node:assert';
import { ElectrificationCatalogueRules } from '../electrification-catalogue.rules';
import { ElectrificationGristAdapter } from './electrification-grist.adapter';
import type { ElectrificationGristData } from './electrification-grist.schema';
import gristAxes from './__fixtures__/electrification-grist-axes.json';

const source: ElectrificationGristData = {
  Axes: [
    {
      id: 1,
      fields: {
        Numero: 13,
        Titre: 'Nouvel axe',
        Code_signe: 'E42',
        Parametre_signe: "Rénover d'ici 2040 ___ bâtiments, dont ___ écoles",
      },
    },
    {
      id: 2,
      fields: {
        Numero: 14,
        Titre: 'Diagnostic',
        Code_signe: 'E99',
        Parametre_signe: 'Préparer un diagnostic (non chiffré)',
      },
    },
  ],
  Sous_axes: [],
  Actions: [],
  Sous_actions: [],
  Indicateurs: [],
  Ressources: [],
};
const reference = (
  codeExterne: string,
  fields: Partial<PublishedIndicateurReference> = {}
): PublishedIndicateurReference => ({
  source: 'engagements-electrification',
  codeExterne,
  identifiantReferentiel: null,
  unite: null,
  periodicite: null,
  version: 'test',
  lienSource: gristAxes.source,
  ...fields,
});
const references = () => [
  reference('E42.total', {
    identifiantReferentiel: 'parc-test',
    unite: 'nb',
    periodicite: 'annuelle',
  }),
];
const build = (
  engagementReferences = references(),
  data = source,
  previous?: ElectrificationConfig
) =>
  ElectrificationGristAdapter.build({
    source: data,
    sourceUrl: gristAxes.source,
    indicateurReferences: [],
    engagementReferences,
    previous,
  });

describe('Engagements publiés depuis Grist', () => {
  it.each(['libelleSource', 'anciensLibelles'] as const)(
    "refuse qu'un %s désigne le code d'un autre engagement",
    (field) => {
      const catalogue = { ...build(), version: 'test' };
      const engagement = catalogue.engagements[0];
      const label = catalogue.engagements[1].code.toLowerCase();
      if (field === 'libelleSource') engagement.libelleSource = label;
      else engagement.anciensLibelles = [label];
      expect(
        ElectrificationCatalogueRules.validateStructure(catalogue)
      ).toContainEqual({
        code: 'DUPLICATE_CATALOGUE_REFERENCE',
        location: `catalogue.engagements[0].${field}${
          field === 'anciensLibelles' ? '[0]' : ''
        }`,
        message: 'Une référence du catalogue est présente plusieurs fois.',
      });
      if (field === 'libelleSource') engagement.libelleSource = engagement.code;
      else engagement.anciensLibelles = [engagement.code];
      expect(ElectrificationCatalogueRules.isValid(catalogue)).toBe(true);
    }
  );

  it('conserve les anciens libellés par code dans le même document, sans réutiliser les mappings', () => {
    const initial = { ...build(), version: 'initial' };
    initial.source = gristAxes.source.replace('/p/78', '/p/99');
    initial.engagements[0].anciensLibelles = ['Un libellé plus ancien'];
    const nextSource = structuredClone(source);
    nextSource.Axes[0].fields.Parametre_signe =
      "Réhabiliter d'ici 2040 ___ bâtiments, dont ___ écoles";
    const next = build([], nextSource, initial);
    expect(next.engagements[0].anciensLibelles).toEqual([
      initial.engagements[0].libelleSource,
      'Un libellé plus ancien',
    ]);
    expect(next.engagements[0].cibles[0]).toMatchObject({
      identifiantReferentiel: null,
      validation: 'pending',
    });
    expect(build([], nextSource, { ...next, version: 'next' })).toEqual(next);
    expect(initial.engagements[0].libelleSource).toBe(
      source.Axes[0].fields.Parametre_signe
    );
  });

  it.each([
    'document',
    'source-absente',
    'code',
    'axe',
    'annee',
    'unite',
    'cle',
  ])(
    'ne reprend pas les libellés après un changement incompatible : %s',
    (change) => {
      const initial = { ...build(), version: 'initial' };
      const engagement = initial.engagements[0];
      const cible = engagement.cibles[0];
      assert(cible.reglesImport);
      engagement.libelleSource = 'Ancien libellé';
      if (change === 'document')
        initial.source = 'https://grist.numerique.gouv.fr/autre';
      if (change === 'source-absente')
        Reflect.deleteProperty(initial, 'source');
      if (change === 'code') engagement.code = 'AUTRE';
      if (change === 'axe') engagement.axeNumero = 14;
      if (change === 'annee') cible.reglesImport.annee = 2050;
      if (change === 'unite') {
        cible.uniteImport = 'MWh';
        cible.reglesImport.unites = ['MWh'];
      }
      if (change === 'cle') cible.key = 'AUTRE';
      expect(
        build([], source, initial).engagements[0].anciensLibelles
      ).toBeUndefined();
    }
  );

  it('refuse les libellés équivalents dans un axe, mais les autorise dans des axes distincts', () => {
    const catalogue = { ...build(), version: 'test' };
    const label = catalogue.engagements[0].libelleSource;
    assert(label);
    catalogue.engagements[1].libelleSource = label.toUpperCase();
    catalogue.engagements[1].axeNumero = 13;
    expect(ElectrificationCatalogueRules.isValid(catalogue)).toBe(false);
    catalogue.engagements[1].axeNumero = 14;
    expect(ElectrificationCatalogueRules.isValid(catalogue)).toBe(true);
    catalogue.engagements[1].libelleSource = 'Autre formulation';
    catalogue.engagements[1].anciensLibelles = [label];
    expect(ElectrificationCatalogueRules.isValid(catalogue)).toBe(true);
    catalogue.engagements[1].axeNumero = 13;
    expect(ElectrificationCatalogueRules.isValid(catalogue)).toBe(false);
  });

  it.each(['cycle', 'unite', 'annee', 'bornes'])(
    'refuse des règles incohérentes à la validation du catalogue : %s',
    (scenario) => {
      const catalogue = { ...build(), version: 'test' };
      expect(ElectrificationCatalogueRules.isValid(catalogue)).toBe(true);
      const [parent, child] = catalogue.engagements[0].cibles;
      assert(parent.reglesImport && child.reglesImport);
      if (scenario === 'cycle') parent.reglesImport.plafondCible = child.key;
      if (scenario === 'unite') child.uniteImport = '%';
      if (scenario === 'annee') child.reglesImport.annee = 2050;
      if (scenario === 'bornes') {
        child.reglesImport.minimum = 10;
        child.reglesImport.maximum = 5;
      }
      expect(ElectrificationCatalogueRules.isValid(catalogue)).toBe(false);
    }
  );

  it('lit de nouveaux codes, cibles et années depuis Grist sans ligne de définition ni mapping obligatoire', () => {
    const catalogue = build();
    expect(catalogue.engagementsFormat).toBe(2);
    expect(catalogue.engagements).toHaveLength(2);
    expect(catalogue.engagements[0]).toMatchObject({
      code: 'E42',
      axeNumero: 13,
      libelleSource: source.Axes[0].fields.Parametre_signe,
      actionTitre: null,
      cibles: [
        {
          key: 'total',
          identifiantReferentiel: 'parc-test',
          unite: 'nb',
          uniteImport: 'bâtiments',
          validation: 'validated',
          reglesImport: {
            annee: 2040,
            minimum: 0,
            maximum: null,
            plafondCible: null,
          },
        },
        {
          key: 'ecoles',
          identifiantReferentiel: null,
          validation: 'pending',
          libelleSource: 'écoles',
          reglesImport: { annee: 2040, plafondCible: 'total' },
        },
      ],
    });
    expect(catalogue.engagements[1]).toMatchObject({
      code: 'E99',
      actionTitre: 'Préparer un diagnostic',
      cibles: [],
    });
    expect(build([]).engagements[0].cibles).toHaveLength(2);
  });

  it('lit les colonnes existantes du Grist : engagements regroupés, pourcentages, énergie et actions non datées', () => {
    const data = structuredClone(source);
    data.Axes = structuredClone(gristAxes.records);
    data.Axes[0].fields.Code_signe = 'E02 + E01';
    const catalogue = build(
      [
        reference('E07.total', {
          identifiantReferentiel: 's_26',
          unite: 'Nombre',
          periodicite: 'annuelle',
        }),
        reference('E07.rapides', {
          identifiantReferentiel: 'elec_6_b',
          unite: 'Nombre',
          periodicite: 'annuelle',
        }),
      ],
      data
    );
    expect(
      ElectrificationCatalogueRules.isValid({
        ...catalogue,
        version: 'grist-test',
      })
    ).toBe(true);
    expect(catalogue.engagements).toHaveLength(12);
    const [fioul, gaz] = catalogue.engagements;
    expect(fioul.libelleSource).toBe(
      "Électrifier d'ici 2030 ___ % des logements chauffés au fioul"
    );
    expect(gaz.libelleSource).toBe(
      "Électrifier d'ici 2030 ___ % des logements chauffés au gaz"
    );
    expect(fioul.cibles[0]).toMatchObject({
      key: 'principale',
      uniteImport: '%',
      reglesImport: { annee: 2030, maximum: 100 },
    });
    expect(
      catalogue.engagements.find(({ code }) => code === 'E07')?.cibles
    ).toMatchObject([
      { key: 'total', identifiantReferentiel: 's_26', uniteImport: 'bornes' },
      {
        key: 'rapides',
        identifiantReferentiel: 'elec_6_b',
        reglesImport: { plafondCible: 'total' },
      },
    ]);
    expect(
      catalogue.engagements.find(({ code }) => code === 'E10')?.cibles[0]
    ).toMatchObject({
      uniteImport: 'MWh',
      reglesImport: { annee: 2030, maximum: null, unites: ['MWh'] },
    });
    expect(
      catalogue.engagements.find(({ code }) => code === 'E12')
    ).toMatchObject({ actionTitre: 'Recharge des poids lourds', cibles: [] });
  });

  it.each(['E42.inconnue', 'E99.principale', 'E123.principale', 'E42'])(
    'refuse une référence sans cible Grist : %s',
    (code) => {
      expect(() => build([...references(), reference(code)])).toThrow();
    }
  );

  it.each(['bâtiments scolaires', 'SCOLAIRES'])(
    'accepte une sous-cible qualifiée par %s',
    (qualifier) => {
      const data = structuredClone(source);
      data.Axes[0].fields.Parametre_signe = `Rénover d'ici 2040 ___ bâtiments, dont ___ ${qualifier}`;
      expect(build([], data).engagements[0].cibles[1]).toMatchObject({
        key: qualifier === 'SCOLAIRES' ? 'scolaires' : 'batiments-scolaires',
        uniteImport: 'bâtiments',
        reglesImport: { plafondCible: 'total', annee: 2040 },
      });
    }
  );

  it.each([
    ['E42+E43', "Rénover d'ici 2040 ___ bâtiments et ___ écoles"],
    ['E42', "Rénover d'ici 2040 ___ bâtiments (E42) et ___ écoles (E43)"],
    ['E42', "Rénover d'ici 2040 ___ bâtiments, dont ___ écoles en 2050"],
    ['E42', "Rénover d'ici 2040 ___ bâtiments et ___ écoles"],
    ['E42', "Rénover d'ici demain ___ bâtiments"],
    ['E42', "Installer d'ici 2030 ___ bornes, dont ___ % rapides"],
    ['E42', "Installer d'ici 2030 ___ bornes, dont ___ kW rapides"],
  ])(
    'refuse une formulation ambiguë sans remplacer les données manquantes : %s / %s',
    (code, label) => {
      const data = structuredClone(source);
      Object.assign(data.Axes[0].fields, {
        Code_signe: code,
        Parametre_signe: label,
      });
      expect(() => build([], data)).toThrow();
    }
  );
});
