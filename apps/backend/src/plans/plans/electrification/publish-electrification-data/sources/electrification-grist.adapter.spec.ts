import type { PublishedIndicateurReference } from '@tet/backend/indicateurs/indicateur/indicateur-reference-externe.repository';
import { describe, expect, it } from 'vitest';
import assert from 'node:assert';
import { ElectrificationCatalogueRules } from '../electrification-catalogue.rules';
import { ElectrificationGristAdapter } from './electrification-grist.adapter';
import type { ElectrificationGristData } from './electrification-grist.schema';

const source: ElectrificationGristData = {
  Axes: [
    {
      id: 1,
      fields: {
        Numero: 13,
        Titre: 'Nouvel axe',
        Code_signe: 'E42+E99',
        Parametre_signe: 'Action qualitative',
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
  lienSource: 'https://grist.numerique.gouv.fr/doc-test',
  libelleSource: null,
  uniteImport: null,
  typeImport: null,
  ciblesImport: null,
  anneeCible: null,
  valeurMin: null,
  valeurMax: null,
  plafondCible: null,
  libellesCible: null,
  unitesAcceptees: null,
  ...fields,
});
const references = () => [
  reference('E42', {
    libelleSource: 'Rénover le parc et ses écoles',
    typeImport: 'cibles',
    ciblesImport: 'parc|ecoles',
  }),
  reference('E42.parc', {
    identifiantReferentiel: 'parc-test',
    unite: 'nb',
    periodicite: 'annuelle',
    uniteImport: 'bâtiments',
    anneeCible: 2040,
    valeurMin: 0,
    libellesCible: 'parc|ensemble',
    unitesAcceptees: 'bâtiment',
  }),
  reference('E42.ecoles', {
    libelleSource: 'Écoles rénovées',
    uniteImport: 'bâtiments',
    anneeCible: 2040,
    valeurMin: 0,
    plafondCible: 'parc',
    libellesCible: 'écoles|école',
    unitesAcceptees: 'bâtiment',
  }),
  reference('E99', {
    typeImport: 'action',
    libelleSource: 'Préparer un diagnostic',
  }),
];
const build = (engagementReferences = references()) =>
  ElectrificationGristAdapter.build({
    source,
    sourceUrl: 'https://grist.numerique.gouv.fr/doc-test',
    indicateurReferences: [],
    engagementReferences,
  });

describe('Définitions publiées des engagements', () => {
  it('refuse les libellés équivalents dans un axe, mais les autorise dans des axes distincts', () => {
    const catalogue = { ...build(), version: 'test' };
    catalogue.engagements[1].libelleSource = 'RENOVER LE PARC, ET SES ECOLES !';
    expect(ElectrificationCatalogueRules.isValid(catalogue)).toBe(false);
    catalogue.axes.push({ numero: 14, titre: 'Autre axe' });
    catalogue.engagements[1].axeNumero = 14;
    expect(ElectrificationCatalogueRules.isValid(catalogue)).toBe(true);
  });

  it.each(['cycle', 'unite', 'annee'])(
    'refuse une relation entre cibles incohérente : %s',
    (scenario) => {
      const catalogue = { ...build(), version: 'test' };
      expect(ElectrificationCatalogueRules.isValid(catalogue)).toBe(true);
      const [parent, child] = catalogue.engagements[0].cibles;
      assert(parent.reglesImport && child.reglesImport);
      if (scenario === 'cycle') parent.reglesImport.plafondCible = child.key;
      if (scenario === 'unite') child.uniteImport = '%';
      if (scenario === 'annee') child.reglesImport.annee = 2050;
      expect(ElectrificationCatalogueRules.isValid(catalogue)).toBe(false);
    }
  );

  it('publie des codes, cibles et années hors du canevas initial, avec une correspondance TeT encore en attente', () => {
    const catalogue = build();
    expect(catalogue.engagementsFormat).toBe(2);
    expect(catalogue.engagements).toHaveLength(2);
    expect(catalogue.engagements[0]).toMatchObject({
      code: 'E42',
      axeNumero: 13,
      libelleSource: 'Rénover le parc et ses écoles',
      actionTitre: null,
      cibles: [
        {
          key: 'parc',
          identifiantReferentiel: 'parc-test',
          unite: 'nb',
          uniteImport: 'bâtiments',
          validation: 'validated',
          reglesImport: {
            annee: 2040,
            minimum: 0,
            maximum: null,
            plafondCible: null,
            libelles: ['parc', 'ensemble'],
            unites: ['bâtiment'],
          },
        },
        {
          key: 'ecoles',
          identifiantReferentiel: null,
          validation: 'pending',
          libelleSource: 'Écoles rénovées',
          reglesImport: { annee: 2040, plafondCible: 'parc' },
        },
      ],
    });
    expect(catalogue.engagements[1]).toEqual({
      code: 'E99',
      axeNumero: 13,
      libelleSource: 'Préparer un diagnostic',
      actionTitre: 'Action qualitative',
      cibles: [],
    });
  });

  it.each(['definition', 'cible', 'plafond', 'orpheline'])(
    'refuse une configuration incomplète ou incohérente : %s',
    (scenario) => {
      const rows = references();
      if (scenario === 'definition') rows.splice(0, 1);
      if (scenario === 'cible') rows.splice(1, 1);
      if (scenario === 'plafond') rows[2].plafondCible = 'absente';
      if (scenario === 'orpheline')
        rows.push(
          reference('E123', { typeImport: 'action', libelleSource: 'Sans axe' })
        );
      expect(() => build(rows)).toThrow();
    }
  );
});
