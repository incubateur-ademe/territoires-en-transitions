import { ImportIndicateurDefinitionType } from '../import-indicateur-definition.dto';

export const sampleImportIndicateurDefinition: ImportIndicateurDefinitionType =
  {
    identifiantReferentiel: 'cae_1.a',
    titre: '\u00c9missions de gaz \u00e0 effet de serre',
    unite: 'kteq CO2',
    titreCourt: null,
    titreLong:
      'Quantit\u00e9 de gaz \u00e0 effet de serre \u00e9mis par les activit\u00e9s et les habitants',
    parents: null,
    categories: ['agregation', 'cae', 'clef', 'crte', 'pcaet'],
    thematiques: ['energie_et_climat'],
    actionIds: ['cae_1.1.1'],
    description:
      "<p>\u00c9missions de gaz \u00e0 effet de serre globales annuelles du territoire exprim\u00e9es en kilo tonnes \u00e9quivalent CO2.</p>\n<p>L'indicateur, issu d'un diagnostic d'\u00e9missions de gaz \u00e0 effet de serre mesure la quantit\u00e9 totale d'\u00e9missions annuelle des diff\u00e9rents secteurs d'activit\u00e9s et des habitants du territoire, selon les exigences r\u00e9glementaires des PCAET (d\u00e9cret n\u00b02016-849 du 28 juin 2016 et arr\u00eat\u00e9 du 4 ao\u00fbt 2016 relatifs au plan climat-air-\u00e9nergie territorial).</p>\n<p>A savoir : les  \u00e9missions  directes  produites par l'ensemble des secteurs r\u00e9sidentiel, tertiaire, transport routier, autres transports, agriculture, d\u00e9chets, industrie hors branche \u00e9nergie, branche \u00e9nergie (hors production d'\u00e9lectricit\u00e9, de chaleur et de froid pour les \u00e9missions de gaz \u00e0 effet de serre, dont les \u00e9missions correspondantes sont comptabilis\u00e9es au stade de la consommation).</p>\n<p>Il ne s'agit pas du bilan GES &quot;Patrimoine et comp\u00e9tences&quot;.</p>\n<p><strong>Modalit\u00e9s de calcul:</strong></p>\n<p>Pour d\u00e9finir les \u00e9missions de GES, se r\u00e9f\u00e9rer \u00e0 l\u2019outil Bilan GES Territoire de l\u2019Ademe</p>\n<p>https://www.bilans-ges.ademe.fr/fr/accueil/contenu/index/page/Bilan%2BGES%2BTerritoires/siGras/0</p>\n<p><strong>Objectif op\u00e9rationnel national fix\u00e9 par les documents de r\u00e9f\u00e9rence:</strong></p>\n<p>Strat\u00e9gie Nationale Bas Carbone (SNBC) :</p>\n<ul>\n<li>\n<p>Valeur cible \u00e0 1,1 teqCO2/hab d\u2019ici 2050</p>\n</li>\n<li>\n<p>40 % \u00e9missions GES globales en 2030 (loi de transition \u00e9nerg\u00e9tique)/ -75 % en 2050 (par rapport \u00e0 1990 - loi POPE)</p>\n</li>\n<li>\n<p>35 % \u00e9missions GES du secteur industriel en 2030 / 80 % en 2050 (par rapport \u00e0 1990)</p>\n</li>\n<li>\n<p>50 % \u00e9missions GES du secteur agricole en 2050 (par rapport \u00e0 2015)</p>\n</li>\n<li>\n<p>0 GES li\u00e9es \u00e0 la production d\u2019\u00e9nergie en 2050</p>\n</li>\n<li>\n<p>0 GES li\u00e9es au secteur du b\u00e2timent en 2050 (100 % de b\u00e2timents neutres)&quot;</p>\n</li>\n</ul>\n",
    valeurCalcule: null,
    participationScore: false,
    sansValeurUtilisateur: false,
    borneMin: null,
    borneMax: null,
    version: '1.0.0',
    precision: 2,
    exprCible: null,
    exprSeuil: null,
    libelleCibleSeuil: null,
  };

export const sampleImportIndicateurDefinition2: ImportIndicateurDefinitionType =
  {
    identifiantReferentiel: 'cae_1.b',
    description:
      "<p>Indicateur &quot;Emissions de gaz \u00e0 effet de serre territoriale&quot; divis\u00e9 par la population totale du territoire pour l'ann\u00e9e concern\u00e9e (source: INSEE).</p>\n",
    titre: 'Emissions de gaz \u00e0 effet de serre par habitant',
    parents: ['cae_1.a'],
    participationScore: false,
    categories: ['cae', 'crte'],
    sansValeurUtilisateur: false,
    thematiques: [],
    titreCourt: null,
    titreLong:
      'Emissions de gaz \u00e0 effet de serre du territoire par habitant',
    unite: 'teq CO2/hab',
    valeurCalcule: null,
    borneMin: null,
    borneMax: null,
    version: '1.0.0',
    precision: 2,
    exprCible: null,
    exprSeuil: null,
    libelleCibleSeuil: null,
  };
