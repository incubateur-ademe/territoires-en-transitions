import { describe, expect, it } from 'vitest';
import {
  createEmptyExtractedAction,
  createUnenrichedSousAction,
  ExtractedAction,
} from '../models/extracted-action';
import { removeDuplicatedContent } from './remove-duplicated-content';

// Fiche réelle d'un PCAET de 92 pages (stratégie segmentée) : le modèle avait
// rangé objectifs, partenaires, financements et leviers, et recopié en plus
// toute la fiche, cartouche lu colonne par colonne compris, en description.
const FICHE_534_DESCRIPTION = `NOUVELLE
Commission
Referent interne
Structure porteuse Partenaires/Financeurs
Challans‑Gois
Challans‑Gois
CGC ; Communes, Chambre d’Agriculture, SAFER
Economie A définir
Commune Bois de Associations : CIVAM, Collectifs Court circuit, Gens du Marais Cené (projet et d'ailleurs, GAB 85, AALVIe, Réseau Paysan de la LPO, expérimental) Syndicat mixte Baie de Bourgneuf, CRC 85, Affaires Maritimes, syndicats agricoles...Représentants des syndicats
Maintenir, accompagner et développer une activité agricole viable sur le long terme ;
Protéger la biodiversité locale ;
Objectifs
Réduire l'utilisation des pesticides et produits phytosanitaires ;
Protéger et sauvegarder les territoires, l'environnement et la santé des citoyens ;
Maintenir les prairies permanentes et l'élevage sur le marais ;
Développer l'agroforesterie, haies bocagères... ;
Volet agricole
Trajectoire
2030 : réduction des émissions de Gaz à Effet de Serre de 10 % par rapport à 2015 ;
2050 : réduction des émissions de Gaz à Effet de Serre de 34 % par rapport à 2015
1) Agir politiquement pour améliorer les pratiques et systèmes agricoles locaux :
Inscrire des contreparties plus fortes pour les bénéficiaires des MAEC (curage des fossés, plantation de haies, ...) ;
Être plus ferme sur l'obtention des permis de construire pour les bâtiments agricoles ;
Éviter ou limiter le remembrement, menace pour les sites Natura 2000 du territoire.
2) Mettre en place un groupe de partage et d'échanges réunissant élus et professionnels du primaire :
Améliorer notre connaissance du secteur agricole : diagnostic agricole du PLUI, état des lieux des parcelles exploitées, etc. ;
Identifier les expériences réussies (agriculture extensive, pâturage, ...) sur le territoire.
3) Expérimenter et développer de nouvelles pratiques agricoles :
Développement de micro‑exploitations : projet de pépinière agricole à bois de Cené ;
Installation et conversion en agriculture biologique ;
Le territoire compte un marais où l'élevage extensif entretient les prairies humides.`;

const OBJECTIFS = [
  "- Réduire l'utilisation des pesticides et produits phytosanitaires",
  "- Protéger et sauvegarder les territoires, l'environnement et la santé des citoyens",
  "- Maintenir les prairies permanentes et l'élevage sur le marais",
  "- Développer l'agroforesterie, haies bocagères",
  '- 2030 : réduction des émissions de Gaz à Effet de Serre de 10 % par rapport à 2015',
  '- 2050 : réduction des émissions de Gaz à Effet de Serre de 34 % par rapport à 2015',
].join('\n');

const PARTENAIRES =
  'Communes, Chambre d’Agriculture, GAB 85, CGC, SAFER, CIVAM, Collectifs Court circuit, Gens du Marais, Cené, AALVIe, Réseau Paysan de la LPO, Syndicat mixte Baie de Bourgneuf, CRC 85, Affaires Maritimes, syndicats agricoles';

// Les leviers 1) à 3) et leur détail, tels que l'enrichissement les rattache.
const enrichedSousAction = (titre: string, description: string) => ({
  ...createUnenrichedSousAction(titre),
  description,
});

const fiche534 = (): ExtractedAction =>
  createEmptyExtractedAction({
    axe: 'Axe 3 : Agriculture',
    titre: 'Accompagner la transition agricole',
    description: FICHE_534_DESCRIPTION,
    objectifs: OBJECTIFS,
    structurePilote: 'Challans-Gois Communauté',
    partenaires: PARTENAIRES,
    budget: 115000,
    moyensHumains: '20000/an (convention CA, GAB.../ Animateur)',
    financements:
      'Plan de Relance, AAP Programme Alimentaire de Territoire, PAC, MAEC, LEADER',
    sousActions: [
      createUnenrichedSousAction(
        'Maintenir, accompagner et développer une activité agricole viable sur le long terme'
      ),
      createUnenrichedSousAction('Protéger la biodiversité locale'),
      createUnenrichedSousAction(
        "Réduire l'utilisation des pesticides et produits phytosanitaires"
      ),
      createUnenrichedSousAction(
        "Protéger et sauvegarder les territoires, l'environnement et la santé des citoyens"
      ),
      createUnenrichedSousAction(
        "Maintenir les prairies permanentes et l'élevage sur le marais"
      ),
      createUnenrichedSousAction(
        "Développer l'agroforesterie, haies bocagères"
      ),
      enrichedSousAction(
        'Agir politiquement pour améliorer les pratiques et systèmes agricoles locaux',
        [
          'Inscrire des contreparties plus fortes pour les bénéficiaires des MAEC (curage des fossés, plantation de haies, ...) ;',
          "Être plus ferme sur l'obtention des permis de construire pour les bâtiments agricoles ;",
          'Éviter ou limiter le remembrement, menace pour les sites Natura 2000 du territoire.',
        ].join('\n')
      ),
      enrichedSousAction(
        "Mettre en place un groupe de partage et d'échanges réunissant élus et professionnels du primaire",
        'Améliorer notre connaissance du secteur agricole : diagnostic agricole du PLUI, état des lieux des parcelles exploitées, etc. Identifier les expériences réussies (agriculture extensive, pâturage, ...) sur le territoire.'
      ),
      createUnenrichedSousAction(
        'Expérimenter et développer de nouvelles pratiques agricoles'
      ),
    ],
  });

describe('removeDuplicatedContent', () => {
  it("ne garde de la fiche 534 que ce qu'aucun autre champ ne reprend", () => {
    const { actions, descriptionLines, sousActions } = removeDuplicatedContent([
      fiche534(),
    ]);
    const [action] = actions;

    expect(action.description).toBe(
      [
        // Le cartouche ne dit pas à quel libellé ces deux valeurs répondent.
        'Economie A définir',
        'Volet agricole',
        // Son détail n'est nulle part ailleurs : l'intertitre reste avec lui.
        '3) Expérimenter et développer de nouvelles pratiques agricoles :',
        'Développement de micro‑exploitations : projet de pépinière agricole à bois de Cené ;',
        'Installation et conversion en agriculture biologique ;',
        "Le territoire compte un marais où l'élevage extensif entretient les prairies humides.",
      ].join('\n')
    );
    expect(action.sousActions.map(({ titre }) => titre)).toEqual([
      'Maintenir, accompagner et développer une activité agricole viable sur le long terme',
      'Protéger la biodiversité locale',
      'Agir politiquement pour améliorer les pratiques et systèmes agricoles locaux',
      "Mettre en place un groupe de partage et d'échanges réunissant élus et professionnels du primaire",
      'Expérimenter et développer de nouvelles pratiques agricoles',
    ]);
    expect(sousActions).toBe(4);
    expect(descriptionLines).toBe(25);
  });

  it('laisse intacte une description qui ne répète aucun autre champ', () => {
    const description =
      "Le covoiturage reste marginal sur le territoire.\n\nLa collectivité s'appuie sur les lignes existantes pour diversifier l'offre.";
    const action = createEmptyExtractedAction({
      titre: 'Réduire l autosolisme',
      description,
      objectifs: '- Doubler la part du covoiturage d ici 2030',
      partenaires: 'Région, ADEME',
      sousActions: [createUnenrichedSousAction('Déployer des aires')],
    });

    const result = removeDuplicatedContent([action]);

    expect(result.actions[0]).toEqual(action);
    expect(result.descriptionLines).toBe(0);
    expect(result.sousActions).toBe(0);
  });

  it('garde une phrase courte légitime et un intertitre sans libellé connu', () => {
    const description = 'Volet agricole\nUn marais à préserver.';
    const result = removeDuplicatedContent([
      createEmptyExtractedAction({
        titre: 'Préserver le marais',
        description,
        partenaires: 'Conservatoire du littoral',
      }),
    ]);

    expect(result.actions[0].description).toBe(description);
  });

  it('garde une phrase qui cite des partenaires parmi d autres mots', () => {
    const description =
      "Le projet sera mené avec la Chambre d'agriculture et la SAFER auprès des exploitants du marais.";
    const result = removeDuplicatedContent([
      createEmptyExtractedAction({
        titre: 'Préserver le marais',
        description,
        partenaires: "Chambre d'agriculture, SAFER",
      }),
    ]);

    expect(result.actions[0].description).toBe(description);
  });

  it('ne confond pas deux cibles qui ne diffèrent que par leurs chiffres', () => {
    const description =
      '2050 : réduction des émissions de gaz à effet de serre de 34 % par rapport à 2015';
    const result = removeDuplicatedContent([
      createEmptyExtractedAction({
        titre: 'Réduire les émissions',
        description,
        objectifs:
          '- 2030 : réduction des émissions de gaz à effet de serre de 10 % par rapport à 2015',
      }),
    ]);

    expect(result.actions[0].description).toBe(description);
  });

  it('compare un montant par sa valeur et retire le libellé qui le précède', () => {
    const result = removeDuplicatedContent([
      createEmptyExtractedAction({
        titre: 'Rénover les écoles',
        description:
          'Programme de rénovation des trois écoles.\nBudget : 115 000\nCoût estimatif',
        budget: 115000,
      }),
    ]);

    expect(result.actions[0].description).toBe(
      'Programme de rénovation des trois écoles.'
    );
    expect(result.descriptionLines).toBe(2);
  });

  it('garde un libellé « … : » tant que la ligne qu il introduit reste', () => {
    const description =
      'Objectifs :\nFaire connaître le dispositif aux habitants.';
    const result = removeDuplicatedContent([
      createEmptyExtractedAction({ titre: 'Communiquer', description }),
    ]);

    expect(result.actions[0].description).toBe(description);
  });

  it('vide une description qui ne répète que le titre et les champs', () => {
    const result = removeDuplicatedContent([
      createEmptyExtractedAction({
        titre: 'Rénover les écoles',
        description: 'Rénover les écoles\nPilote :\nService patrimoine',
        directionServicePilote: 'Service patrimoine',
      }),
    ]);

    expect(result.actions[0].description).toBeNull();
    expect(result.descriptionLines).toBe(3);
  });

  it('ne touche pas une description vide ou absente', () => {
    const actions = [
      createEmptyExtractedAction({ titre: 'A', description: null }),
      createEmptyExtractedAction({ titre: 'B', description: '' }),
    ];

    const result = removeDuplicatedContent(actions);

    expect(result.actions.map(({ description }) => description)).toEqual([
      null,
      '',
    ]);
    expect(result.descriptionLines).toBe(0);
  });

  it('garde une sous-action proche d un objectif mais qui porte un pilote ou sa propre description', () => {
    const result = removeDuplicatedContent([
      createEmptyExtractedAction({
        titre: 'Réduire les pesticides',
        objectifs: "- Réduire l'utilisation des pesticides",
        sousActions: [
          {
            ...createUnenrichedSousAction(
              "Réduire l'utilisation des pesticides"
            ),
            personnePilote: 'Jean Dupont',
          },
          {
            ...createUnenrichedSousAction(
              "Réduire l'utilisation des pesticides"
            ),
            description: 'Former les agents des espaces verts au désherbage.',
          },
          createUnenrichedSousAction('Former les agriculteurs'),
        ],
      }),
    ]);

    expect(result.actions[0].sousActions).toHaveLength(3);
    expect(result.sousActions).toBe(0);
  });

  it('laisse telle quelle une action lue dans un tableur', () => {
    const action = createEmptyExtractedAction({
      titre: 'Rénover les écoles',
      description: 'Statut\nPilote : Service patrimoine',
      directionServicePilote: 'Service patrimoine',
      objectifs: '- Rénover les écoles',
      sousActions: [createUnenrichedSousAction('Rénover les écoles')],
      sourceTableur: { onglet: 'Suivi', premiereLigne: 3, derniereLigne: 3 },
    });

    const result = removeDuplicatedContent([action]);

    expect(result.actions[0]).toBe(action);
    expect(result).toMatchObject({ descriptionLines: 0, sousActions: 0 });
  });

  it('ne prend pas la partie entière d’un nombre décimal pour un numéro de liste', () => {
    const action = createEmptyExtractedAction({
      titre: 'Financer la rénovation',
      description: 'Budget : 2.5 M€',
      financements: '1.5 M€',
    });

    const result = removeDuplicatedContent([action]);

    expect(result.actions[0].description).toBe('Budget : 2.5 M€');
  });
});
