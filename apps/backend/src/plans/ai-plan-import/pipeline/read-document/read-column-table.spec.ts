import { describe, expect, it } from 'vitest';
import { ColumnTableContext, readColumnTable } from './read-column-table';
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

const textsOf = (
  items: PositionedItem[],
  previous: ColumnTableContext | null = null
) => readColumnTable(items, previous)?.lines.map((line) => line.text);

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
      "### A 1 : Diagnostiquer l'usage de l'eau",
      "Objectifs : - Limiter les usages - Adapter l'offre",
      'Portage : Chambre',
      'Réalisation : 2024-2027',
      '### A 2 : Former les exploitants',
      "Objectifs : - Limiter les usages - Adapter l'offre",
      'Portage : Chambre',
      'Réalisation : 2024-2027',
      '### A 3 : Harmoniser les tarifs',
      "Objectifs : - Limiter les usages - Adapter l'offre",
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
      '### A 4 : Animer un groupe',
      'Objectifs : - Structurer',
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
      '### A 1 : Diagnostiquer',
      'Objectifs : - Limiter',
      'Portage : CCPF',
      'Réalisation : 2024 et années suivantes',
      '### A 2 Former les exploitants',
      'Objectifs : - Limiter',
      'Portage : SAFER',
      'Réalisation : 2025 et années suivantes',
      '### A 3 : Harmoniser',
      'Objectifs : - Limiter',
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

  describe('suite du tableau à la page suivante', () => {
    const numberedTable = () =>
      readColumnTable(
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
        ],
        null
      )?.context ?? null;

    it("ne prend pas le cartouche d'une fiche, aligné sur les colonnes, pour la suite d'un tableau numéroté", () => {
      const cartouche = [
        at(50, 100, 'Pilote'),
        at(390, 100, 'Service environnement'),
        at(50, 120, 'Budget'),
        at(390, 120, '12 000 €'),
        at(50, 140, 'Calendrier'),
        at(390, 140, '2024-2026'),
        at(50, 160, 'Partenaires'),
        at(390, 160, 'ADEME'),
      ];

      const lines = textsOf(cartouche, numberedTable()) ?? [];

      expect(lines.some((line) => line.startsWith('## Pilote'))).toBe(false);
    });

    it('reprend les libellés pour une seule rangée numérotée', () => {
      expect(
        textsOf(
          [
            at(390, 60, 'A 4 : Animer un groupe'),
            at(620, 60, 'SAFER'),
            at(720, 60, '2027'),
          ],
          numberedTable()
        )
      ).toEqual([
        '### A 4 : Animer un groupe',
        'Portage : SAFER',
        'Réalisation : 2027',
      ]);
    });

    it('reconnaît la suite d’un tableau sans numéros', () => {
      const first = readColumnTable(
        [
          ...header,
          at(390, 140, 'Diagnostiquer les usages'),
          at(620, 140, 'CCPF'),
          at(720, 140, '2024'),
          at(390, 180, 'Former les exploitants'),
          at(620, 180, 'CCPF'),
          at(720, 180, '2025'),
          at(390, 220, 'Harmoniser les tarifs'),
          at(620, 220, 'CCPF'),
          at(720, 220, '2026'),
          at(50, 180, '1- GESTION DE LA RESSOURCE'),
        ],
        null
      );

      expect(
        textsOf(
          [
            at(390, 60, 'Animer un groupe'),
            at(620, 60, 'SAFER'),
            at(720, 60, '2027'),
            at(390, 100, 'Créer une commission'),
            at(620, 100, 'SAFER'),
            at(720, 100, '2028'),
          ],
          first?.context ?? null
        )
      ).toEqual([
        'Animer un groupe',
        'Portage : SAFER',
        'Réalisation : 2027',
        'Créer une commission',
        'Portage : SAFER',
        'Réalisation : 2028',
      ]);
    });
  });

  it('sépare des actions sans numéro aux rangées serrées quand les valeurs marquent chaque rangée', () => {
    const small = (x: number, y: number, text: string): PositionedItem => ({
      ...at(x, y, text),
      fontSize: 8,
    });
    const items = [
      ...header,
      at(390, 140, 'Diagnostiquer les usages'),
      at(390, 154, 'Former les exploitants'),
      at(390, 168, 'Harmoniser les tarifs'),
      small(620, 140, 'CCPF'),
      small(620, 154, 'SAFER'),
      small(620, 168, 'CDA'),
      at(50, 154, '1- GESTION'),
    ];

    expect(textsOf(items)).toEqual([
      '## 1- GESTION',
      'Diagnostiquer les usages',
      'Portage : CCPF',
      'Former les exploitants',
      'Portage : SAFER',
      'Harmoniser les tarifs',
      'Portage : CDA',
    ]);
  });

  it('garde entier le titre numéroté sur deux lignes, face à une valeur sur deux lignes', () => {
    const small = (x: number, y: number, text: string): PositionedItem => ({
      ...at(x, y, text),
      fontSize: 8,
    });
    const items = [
      ...header,
      at(390, 140, 'A 40 : Poursuivre'),
      at(390, 154, "l'opération"),
      small(620, 140, 'SERVICE'),
      small(620, 154, 'DÉCHETS'),
      at(390, 190, 'A 41 : Financer'),
      at(390, 204, 'les équipements'),
      small(620, 190, 'SERVICE'),
      small(620, 204, 'DÉCHETS'),
      at(390, 240, 'A 42 : Peser'),
      small(620, 240, 'CCPF'),
      at(50, 190, '1- GASPILLAGE'),
    ];

    expect(textsOf(items)?.slice(1, 3)).toEqual([
      "### A 40 : Poursuivre l'opération",
      'Portage : SERVICE DÉCHETS',
    ]);
  });

  it('titre une rangée numérotée par le premier paragraphe de sa cellule, sans couper la phrase qui passe à la ligne', () => {
    const items = [
      ...header,
      at(390, 140, 'A 1 : Poursuivre l’étude sur la'),
      at(390, 152, 'station d’épuration'),
      at(390, 164, 'Volet 1 : faisabilité'),
      at(390, 176, 'Volet 2 : acceptation sociale'),
      at(620, 140, 'CCPF'),
      at(390, 220, 'A 2 : Créer un réseau local'),
      at(390, 232, '« d’éducation »'),
      at(620, 220, 'SAFER'),
      at(390, 270, 'A 3 : Installer'),
      at(410, 282, '- Prise en charge des frais'),
      at(620, 270, 'CDA'),
      at(50, 220, '1- GESTION'),
    ];

    expect(textsOf(items)).toEqual([
      '## 1- GESTION',
      '### A 1 : Poursuivre l’étude sur la station d’épuration',
      'Volet 1 : faisabilité Volet 2 : acceptation sociale',
      'Portage : CCPF',
      '### A 2 : Créer un réseau local « d’éducation »',
      'Portage : SAFER',
      '### A 3 : Installer',
      '- Prise en charge des frais',
      'Portage : CDA',
    ]);
  });

  it('laisse dans la fiche d’au-dessus une rangée sans numéro, suite de page comprise', () => {
    const first = readColumnTable(
      [
        ...header,
        at(390, 140, 'A 1 : Diagnostiquer'),
        at(620, 140, 'CCPF'),
        at(390, 180, 'Actions à définir avec les partenaires'),
        at(620, 180, 'CCPF'),
        at(390, 220, 'A 2 : Développer le vélo sur tout le'),
        at(620, 220, 'CCPF'),
        at(50, 180, '1- MOBILITE'),
      ],
      null
    );
    const next = readColumnTable(
      [
        at(390, 60, 'territoire intercommunal'),
        at(390, 72, '- Volet 2 : communication'),
        at(390, 120, 'A 3 : Animer un groupe'),
        at(620, 120, 'SAFER'),
      ],
      first?.context ?? null
    );

    expect(
      [...(first?.lines ?? []), ...(next?.lines ?? [])].map((line) => line.text)
    ).toEqual([
      '## 1- MOBILITE',
      '### A 1 : Diagnostiquer',
      'Portage : CCPF',
      'Actions à définir avec les partenaires',
      'Portage : CCPF',
      '### A 2 : Développer le vélo sur tout le',
      'Portage : CCPF',
      'territoire intercommunal - Volet 2 : communication',
      '### A 3 : Animer un groupe',
      'Portage : SAFER',
    ]);
  });

  it('redit sous chaque fiche le regroupement intermédiaire qui les couvre', () => {
    const items = [
      ...header,
      at(390, 140, 'A 1 : Diagnostiquer'),
      at(620, 140, 'CCPF'),
      at(390, 180, 'A 2 : Former'),
      at(620, 180, 'CCPF'),
      at(390, 220, 'A 3 : Harmoniser'),
      at(620, 220, 'CCPF'),
      at(50, 180, '1- GESTION'),
      at(200, 180, '- Limiter les usages'),
    ];

    expect(
      textsOf(items)?.filter((text) => text.startsWith('Objectifs'))
    ).toEqual([
      'Objectifs : - Limiter les usages',
      'Objectifs : - Limiter les usages',
      'Objectifs : - Limiter les usages',
    ]);
  });

  it('garde entier un titre sur plusieurs lignes face à une valeur centrée', () => {
    const items = [
      ...header,
      at(390, 140, 'Diagnostiquer les usages'),
      at(390, 152, "de l'eau agricole"),
      at(390, 164, 'sur tout le territoire'),
      at(620, 152, 'CCPF'),
      at(720, 152, '2024'),
      at(390, 200, 'Former les exploitants'),
      at(620, 200, 'SAFER'),
      at(720, 200, '2025'),
      at(390, 240, 'Harmoniser les tarifs'),
      at(620, 240, 'CDA'),
      at(720, 240, '2026'),
      at(50, 200, '1- GESTION'),
    ];

    expect(textsOf(items)?.slice(1, 4)).toEqual([
      "Diagnostiquer les usages de l'eau agricole sur tout le territoire",
      'Portage : CCPF',
      'Réalisation : 2024',
    ]);
  });

  it("laisse vide le libellé d'une colonne sans en-tête, sans y prendre sa première valeur", () => {
    const items = [
      at(50, 100, 'Enjeux'),
      at(200, 100, 'Objectifs'),
      at(390, 100, 'Actions'),
      at(720, 100, 'Réalisation'),
      at(390, 125, 'A 1 : Diagnostiquer'),
      at(620, 125, 'CCPF'),
      at(720, 125, '2024'),
      at(390, 165, 'A 2 : Former'),
      at(620, 165, 'CCPF'),
      at(720, 165, '2025'),
      at(390, 205, 'A 3 : Harmoniser'),
      at(620, 205, 'SAFER'),
      at(720, 205, '2026'),
      at(50, 165, '1- GESTION'),
      at(200, 165, '- Limiter'),
    ];

    expect(textsOf(items)).toEqual([
      '## 1- GESTION',
      '### A 1 : Diagnostiquer',
      'Objectifs : - Limiter',
      'CCPF',
      'Réalisation : 2024',
      '### A 2 : Former',
      'Objectifs : - Limiter',
      'CCPF',
      'Réalisation : 2025',
      '### A 3 : Harmoniser',
      'Objectifs : - Limiter',
      'SAFER',
      'Réalisation : 2026',
    ]);
  });

  it('garde sur chaque ligne les liens des cellules dont elle reprend le texte', () => {
    const link = (text: string) => ({
      text,
      target: `https://exemple.fr/${text}`,
      kind: 'hyperlink' as const,
      location: { pageIndex: 0 },
    });
    const withLink = (item: PositionedItem): PositionedItem => ({
      ...item,
      links: [link(item.text)],
    });
    const items = [
      ...header,
      withLink(at(390, 140, 'A 1 : Diagnostiquer')),
      withLink(at(620, 140, 'CCPF')),
      at(720, 140, '2024'),
      at(390, 180, 'A 2 : Former'),
      at(620, 180, 'SAFER'),
      at(720, 180, '2025'),
      at(390, 220, 'A 3 : Harmoniser'),
      at(620, 220, 'CDA'),
      at(720, 220, '2026'),
      withLink(at(50, 180, '1- GESTION')),
    ];

    const lines = readColumnTable(items, null)?.lines ?? [];
    const linksOf = (text: string) =>
      lines
        .find((line) => line.text === text)
        ?.links?.map((found) => found.text);

    expect(linksOf('## 1- GESTION')).toEqual(['1- GESTION']);
    expect(linksOf('### A 1 : Diagnostiquer')).toEqual(['A 1 : Diagnostiquer']);
    expect(linksOf('Portage : CCPF')).toEqual(['CCPF']);
    expect(linksOf('Réalisation : 2024')).toBeUndefined();
  });
});
