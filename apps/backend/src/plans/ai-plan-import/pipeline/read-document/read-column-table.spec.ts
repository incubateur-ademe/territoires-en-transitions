import { describe, expect, it } from 'vitest';
import { readColumnTable } from './read-column-table';
import { PositionedItem } from './reconstruct-page-lines';

const FONT = 10;

/** Une ligne de texte posée en (x, y), large de 5 points par caractère. */
const at = (x: number, y: number, text: string): PositionedItem => ({
  text,
  x,
  right: x + text.length * 5,
  y,
  fontSize: FONT,
});

// Cinq colonnes : enjeux (x 50), objectifs (x 200), actions (x 390),
// portage (x 620), réalisation (x 720).
const header = [
  at(50, 100, 'Enjeux'),
  at(200, 100, 'Objectifs'),
  at(390, 100, 'Actions'),
  at(620, 100, 'Portage'),
  at(720, 100, 'Réalisation'),
];

const textsOf = (items: PositionedItem[], previous = null) =>
  readColumnTable(items, previous)?.lines.map((line) => line.text);

describe('readColumnTable', () => {
  it('lit un tableau à en-tête rangée par rangée, cellules fusionnées comprises', () => {
    const items = [
      at(60, 60, 'AXE 1 – EAU ET AGRICULTURE DURABLE POUR TOUS LES HABITANTS'),
      ...header,
      // Trois actions ; l'enjeu et l'objectif, fusionnés, sont centrés sur
      // l'ensemble ; le portage de A 1 et A 2 est une seule cellule.
      at(390, 140, 'A 1 : Diagnostiquer'),
      at(390, 152, "l'usage de l'eau"),
      at(390, 200, 'A 2 : Former les'),
      at(390, 212, 'exploitants'),
      at(620, 176, 'Chambre'),
      at(720, 176, '2024-2027'),
      at(390, 260, 'A 3 : Harmoniser les tarifs'),
      at(620, 260, 'CCPF'),
      at(720, 260, '2024'),
      at(50, 194, '1- GESTION DE'),
      at(50, 206, 'LA RESSOURCE'),
      at(200, 194, '- Limiter les usages'),
      at(200, 206, "- Adapter l'offre"),
    ];

    expect(textsOf(items)).toEqual([
      'AXE 1 – EAU ET AGRICULTURE DURABLE POUR TOUS LES HABITANTS',
      '## 1- GESTION DE LA RESSOURCE',
      "Objectifs : - Limiter les usages - Adapter l'offre",
      "A 1 : Diagnostiquer l'usage de l'eau",
      'Portage : Chambre',
      'Réalisation : 2024-2027',
      'A 2 : Former les exploitants',
      'Portage : Chambre',
      'Réalisation : 2024-2027',
      'A 3 : Harmoniser les tarifs',
      'Portage : CCPF',
      'Réalisation : 2024',
    ]);
  });

  it("reprend l'en-tête et le regroupement de la page précédente, sans redire le titre", () => {
    const first = readColumnTable(
      [
        ...header,
        at(390, 140, 'A 1 : Diagnostiquer'),
        at(620, 140, 'CCPF'),
        at(720, 140, '2024'),
        at(390, 180, 'A 2 : Former'),
        at(620, 180, 'CCPF'),
        at(720, 180, '2025'),
        at(390, 220, 'A 3 : Harmoniser'),
        at(620, 220, 'CCPF'),
        at(720, 220, '2026'),
        at(50, 180, '1- GESTION DE LA RESSOURCE'),
        at(200, 180, '- Limiter les usages'),
      ],
      null
    );
    const next = readColumnTable(
      [
        at(390, 60, 'A 4 : Animer un groupe'),
        at(620, 60, 'SAFER'),
        at(720, 60, '2027'),
        at(390, 100, 'A 5 : Créer une commission'),
        at(620, 100, 'SAFER'),
        at(720, 100, '2028'),
        at(390, 140, 'A 6 : Communiquer'),
        at(620, 140, 'CCPF'),
        at(720, 140, '2028'),
        at(390, 180, 'A 7 : Évaluer'),
        at(620, 180, 'CCPF'),
        at(720, 180, '2029'),
        at(50, 124, '2- GOUVERNANCE FONCIERE'),
        at(200, 124, '- Structurer'),
      ],
      first?.context ?? null
    );

    expect(next?.lines.map((line) => line.text).slice(0, 5)).toEqual([
      '## 2- GOUVERNANCE FONCIERE',
      'Objectifs : - Structurer',
      'A 4 : Animer un groupe',
      'Portage : SAFER',
      'Réalisation : 2027',
    ]);
  });

  it('sépare les rangées serrées par leur numéro, et leurs valeurs par leur alignement', () => {
    // Chaque valeur est centrée sur sa rangée ; aucune ligne blanche entre elles.
    const items = [
      ...header,
      at(390, 146, 'A 1 : Diagnostiquer'),
      at(620, 146, 'CCPF'),
      at(720, 140, '2024 et années'),
      at(720, 152, 'suivantes'),
      at(390, 170, 'A 2 Former les exploitants'),
      at(620, 170, 'SAFER'),
      at(720, 164, '2025 et années'),
      at(720, 176, 'suivantes'),
      at(390, 194, 'A 3 : Harmoniser'),
      at(620, 194, 'CDA'),
      at(720, 194, '2026'),
      at(50, 170, '1- GESTION'),
      at(200, 170, '- Limiter'),
    ];

    expect(textsOf(items)).toEqual([
      '## 1- GESTION',
      'Objectifs : - Limiter',
      'A 1 : Diagnostiquer',
      'Portage : CCPF',
      'Réalisation : 2024 et années suivantes',
      'A 2 Former les exploitants',
      'Portage : SAFER',
      'Réalisation : 2025 et années suivantes',
      'A 3 : Harmoniser',
      'Portage : CDA',
      'Réalisation : 2026',
    ]);
  });

  it('lit des cartes côte à côte, sans en-tête, colonne par colonne', () => {
    const card = (x: number, title: string, body: string) => [
      at(x, 300, title),
      at(x, 312, 'scolaires'),
      at(x, 350, body),
      at(x, 362, 'chaque année'),
    ];
    const items = [
      at(
        50,
        250,
        'Les actions de cet axe concernent tous les publics du territoire communautaire.'
      ),
      ...card(60, 'Sensibiliser les', 'Programmer des visites'),
      ...card(250, 'Promouvoir le don', 'Accompagner les pros'),
      ...card(440, 'Animer le réseau', 'Organiser des ateliers'),
    ];

    expect(textsOf(items)).toEqual([
      'Les actions de cet axe concernent tous les publics du territoire communautaire.',
      '### Sensibiliser les scolaires',
      'Programmer des visites chaque année',
      '### Promouvoir le don scolaires',
      'Accompagner les pros chaque année',
      '### Animer le réseau scolaires',
      'Organiser des ateliers chaque année',
    ]);
  });

  it('sépare des cartes décalées en hauteur, que seule une bande vide distingue', () => {
    // Les cartes 1 et 4 partagent leurs lignes, les cartes 2 et 3 les leurs,
    // six points plus bas : aucune ligne ne montre le blanc entre 1 et 2, ni
    // entre 3 et 4.
    const card = (x: number, y: number, name: string) => [
      at(x, y, `Développer le compostage ${name}`),
      at(x, y + 12, 'dans tous les villages du pays'),
      at(x, y + 50, 'Former les agents des communes'),
      at(x, y + 62, 'aux gestes du tri à la source'),
      at(x, y + 100, 'Objectif : un site par commune'),
    ];
    const items = [
      ...card(60, 300, 'partagé'),
      ...card(240, 306, 'de quartier'),
      ...card(420, 306, 'scolaire'),
      ...card(600, 300, 'individuel'),
    ];

    expect(textsOf(items)?.filter((text) => text.startsWith('###'))).toEqual([
      '### Développer le compostage partagé dans tous les villages du pays',
      '### Développer le compostage de quartier dans tous les villages du pays',
      '### Développer le compostage scolaire dans tous les villages du pays',
      '### Développer le compostage individuel dans tous les villages du pays',
    ]);
  });

  it('lit deux cartes au texte centré, pas deux colonnes de prose', () => {
    const lines = [
      [0, 'Informer les entreprises de leurs obligations'],
      [12, 'vis-à-vis des déchets'],
      [60, 'Rappeler le cadre de la gestion des déchets'],
      [72, 'par le biais de la facture'],
      [84, 'et des publications des chambres consulaires'],
      [120, 'Objectif : dix pour cent de tonnages en moins'],
    ] as const;
    const centered = (center: number) =>
      lines.map(([y, text]) => at(center - text.length * 2.5, 300 + y, text));
    const aligned = (x: number) =>
      lines.map(([y, text]) => at(x, 300 + y, text));

    expect(textsOf([...centered(200), ...centered(560)])).toEqual([
      '### Informer les entreprises de leurs obligations vis-à-vis des déchets',
      'Rappeler le cadre de la gestion des déchets par le biais de la facture et des publications des chambres consulaires',
      'Objectif : dix pour cent de tonnages en moins',
      '### Informer les entreprises de leurs obligations vis-à-vis des déchets',
      'Rappeler le cadre de la gestion des déchets par le biais de la facture et des publications des chambres consulaires',
      'Objectif : dix pour cent de tonnages en moins',
    ]);
    expect(readColumnTable([...aligned(60), ...aligned(420)], null)).toBeNull();
  });

  it("n'ouvre pas les cartes à une ligne de prose coupée par un blanc", () => {
    const card = (x: number, title: string, body: string) => [
      at(x, 300, title),
      at(x, 312, 'scolaires'),
      at(x, 350, body),
      at(x, 362, 'chaque année'),
    ];
    const prose =
      'Les actions de cet axe concernent tous les publics du territoire.';
    const items = [
      // Une ligne justifiée dont le dernier mot est rejeté à droite.
      at(50, 200, prose),
      at(700, 200, 'À'),
      at(50, 212, `${prose} Elles se déploient sur six ans.`),
      at(50, 224, `${prose} Elles se déploient sur six ans.`),
      ...card(60, 'Sensibiliser les', 'Programmer des visites'),
      ...card(250, 'Promouvoir le don', 'Accompagner les pros'),
      ...card(440, 'Animer le réseau', 'Organiser des ateliers'),
    ];

    expect(textsOf(items)?.slice(0, 5)).toEqual([
      `${prose} À`,
      `${prose} Elles se déploient sur six ans.`,
      `${prose} Elles se déploient sur six ans.`,
      '### Sensibiliser les scolaires',
      'Programmer des visites chaque année',
    ]);
  });

  it('ne touche pas une page de prose, ni un libellé face à sa valeur', () => {
    const prose = Array.from({ length: 8 }, (_, index) =>
      at(
        50,
        100 + index * 12,
        'Un paragraphe de texte courant sur toute la largeur de la page.'
      )
    );
    const cartouche = [
      at(50, 100, 'Pilote'),
      at(300, 100, 'Service environnement'),
      at(50, 120, 'Budget'),
      at(300, 120, '12 000 €'),
      at(50, 140, 'Calendrier'),
      at(300, 140, '2024-2026'),
      at(50, 160, 'Partenaires'),
      at(300, 160, 'ADEME'),
    ];

    expect(readColumnTable(prose, null)).toBeNull();
    expect(readColumnTable(cartouche, null)).toBeNull();
  });
});
