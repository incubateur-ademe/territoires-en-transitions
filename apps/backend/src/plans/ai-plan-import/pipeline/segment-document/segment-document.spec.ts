import { describe, expect, it } from 'vitest';
import { buildHorizontalHierarchyWorkbook } from '../__fixtures__/build-test-workbook';
import { buildDocument, buildPage } from '../document/document-page';
import { readDocument } from '../read-document/read-document';
import type { ActionLevel } from '../../models/import-question';
import { detectActionLevelDoubt, detectHeadings } from './detect-headings';
import { segmentDocument } from './segment-document';
import { renderUnit } from './render-unit';

describe('segmentDocument', () => {
  it('numérote les unités d’un PDF dans l’ordre, en sautant les pages vides', () => {
    const document = buildDocument('pdf', [
      buildPage(0, [{ text: 'Axe 1 : Bâtiments' }]),
      buildPage(1, []),
      buildPage(2, [
        { text: 'Action 1.1.1 : Isoler' },
        { text: 'Pilote : Service' },
      ]),
    ]);

    const units = segmentDocument(document, {
      minTokens: 0,
      maxTokens: 1000,
      overlapTokens: 0,
    });

    expect(units.map((unit) => unit.id)).toEqual(['u0001', 'u0002']);
    expect(units[1]).toMatchObject({ kind: 'fiche', pageStart: 2, pageEnd: 2 });
  });

  it('découpe un classeur lu avec sa grille par fiches, sous son vrai en-tête', async () => {
    const read = await readDocument({
      buffer: await buildHorizontalHierarchyWorkbook(),
      mimeType:
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    if (!read.success) {
      throw new Error(read.error.kind);
    }

    const units = segmentDocument(read.data);
    const suivi = units.filter(({ headingPath }) => headingPath[0] === 'Suivi');

    expect(suivi.map(({ headingPath }) => headingPath[1])).toEqual([
      'AMBITION n°1 : Pour un territoire sobre en énergie',
      'AMBITION n°2 Pour un territoire préservé',
    ]);
    expect(suivi[1].lines[0].text).toContain('CALENDRIER · 2021');
  });

  it('découpe un tableur sans grille par lignes entières, en-tête répété', () => {
    const rows = Array.from(
      { length: 30 },
      (_, i) => `Axe ${i % 3}\tAction ${i}\tDescription assez longue ${i}`
    );
    const document = buildDocument('xlsx', [
      buildPage(
        0,
        ['axe\ttitre\tdescription', ...rows].map((text) => ({ text })),
        { label: 'Actions' }
      ),
    ]);

    const units = segmentDocument(document, {
      minTokens: 0,
      maxTokens: 120,
      overlapTokens: 0,
    });

    expect(units.length).toBeGreaterThan(1);
    for (const unit of units) {
      expect(unit.kind).toBe('table');
      expect(unit.lines[0].text).toBe('axe\ttitre\tdescription');
      expect(unit.headingPath).toEqual(['Actions']);
    }
    const allRows = units.flatMap((unit) =>
      unit.lines.slice(1).map((line) => line.text)
    );
    expect(allRows).toEqual(rows);
  });
});

const body = (count: number) =>
  Array.from({ length: count }, (_, i) => ({
    text: `Un paragraphe de corps de texte normal, numéro ${i}.`,
    fontSize: 12,
  }));

describe('detectHeadings', () => {
  it('lit un titre en grande police réparti sur plusieurs lignes', () => {
    const headings = detectHeadings([
      buildPage(0, [
        { text: 'ENGAGEMENT', fontSize: 70 },
        { text: 'DES PARTENAIRES', fontSize: 70 },
        ...body(5),
      ]),
    ]);

    expect(headings).toEqual([
      {
        pageIndex: 0,
        lineIndex: 0,
        lastLineIndex: 1,
        isLarge: true,
        match: expect.objectContaining({
          kind: 'section',
          title: 'ENGAGEMENT DES PARTENAIRES',
        }),
      },
    ]);
  });

  it('recolle le début du titre au-dessus du numéro de fiche', () => {
    const headings = detectHeadings([
      buildPage(0, [
        { text: 'I. TOUS HÉROS ORDINAIRES', fontSize: 12 },
        { text: 'ANCRER L’ADMINISTRATION', fontSize: 20 },
        { text: '1 DANS L’ÉCO-RESPONSABILITÉ', fontSize: 40 },
        ...body(5),
      ]),
    ]);

    expect(headings.map(({ lineIndex, match }) => [lineIndex, match])).toEqual([
      [0, expect.objectContaining({ kind: 'axe', number: 'I' })],
      [
        1,
        expect.objectContaining({
          kind: 'numero',
          number: '1',
          title: 'ANCRER L’ADMINISTRATION DANS L’ÉCO-RESPONSABILITÉ',
        }),
      ],
    ]);
  });

  it('recolle un début de titre en un seul mot, ou sur deux lignes', () => {
    const headings = detectHeadings([
      buildPage(0, [
        { text: 'APPROFONDIR', fontSize: 20 },
        { text: '1 LA CONNAISSANCE LOCALE', fontSize: 40 },
        ...body(3),
        { text: 'SE PRÉPARER AU CLIMAT', fontSize: 20 },
        { text: 'DE DEMAIN :', fontSize: 20 },
        { text: '2 LA VILLE VÉGÉTALE', fontSize: 40 },
        ...body(3),
      ]),
    ]);

    expect(
      headings.map(({ lineIndex, match }) => [lineIndex, match.title])
    ).toEqual([
      [0, 'APPROFONDIR LA CONNAISSANCE LOCALE'],
      [5, 'SE PRÉPARER AU CLIMAT DE DEMAIN : LA VILLE VÉGÉTALE'],
    ]);
  });

  it('écarte un numéro seul qui ne prolonge pas la suite des fiches', () => {
    const headings = detectHeadings([
      buildPage(0, [
        { text: '66 PLAN CLIMAT', fontSize: 40 },
        { text: '1 SOBRIÉTÉ ÉNERGÉTIQUE', fontSize: 40 },
        { text: '2 MOBILITÉ DOUCE', fontSize: 40 },
        { text: '40 GIGAWATTS ÉVITÉS', fontSize: 40 },
        ...body(8),
      ]),
    ]);

    expect(headings.map(({ match }) => match.number)).toEqual(['1', '2']);
  });

  it('ignore les lignes en toute petite police, comme les logos', () => {
    expect(
      detectHeadings([
        buildPage(0, [
          { text: 'LOGOTYPE TONS DIRECTS', fontSize: 2 },
          ...body(5),
        ]),
      ])
    ).toEqual([]);
  });

  it('tient une ligne en majuscules pour un grand titre quand sa police est plus grande', () => {
    const pages = [
      buildPage(0, [
        { text: 'RÉNOVER LE PATRIMOINE BÂTI', fontSize: 18 },
        { text: 'Un paragraphe de corps de texte normal.', fontSize: 10 },
        { text: 'Un autre paragraphe de corps de texte.', fontSize: 10 },
      ]),
    ];

    expect(detectHeadings(pages)).toEqual([
      {
        pageIndex: 0,
        lineIndex: 0,
        lastLineIndex: 0,
        isLarge: true,
        match: expect.objectContaining({ level: 1, confidence: 0.8 }),
      },
    ]);
  });
});

describe('detectHeadings sur un PCAET à fiches tabulaires', () => {
  const titles = (pages: ReturnType<typeof buildPage>[]) =>
    detectHeadings(pages).map(({ match }) => [
      match.kind,
      match.level,
      match.title,
    ]);

  it("prend le bandeau d'objectif au-dessus d'une fiche pour son sous-axe, et recolle le titre long de la fiche", () => {
    expect(
      titles([
        buildPage(0, [
          { text: '1- AMELIORER LA PERFORMANCE DES BATIMENTS', fontSize: 16 },
          {
            text: 'ACTION 2 - ACCOMPAGNER LES PROJETS DE CONSTRUCTION POUR ATTEINDRE DES OBJECTIFS DE',
            fontSize: 16,
          },
          {
            text: 'PERFORMANCE DE "TRES BASSE CONSOMMATION" OU "PASSIF"',
            fontSize: 16,
          },
          ...body(5),
        ]),
      ])
    ).toEqual([
      ['orientation', 2, 'AMELIORER LA PERFORMANCE DES BATIMENTS'],
      [
        'fiche',
        3,
        'ACCOMPAGNER LES PROJETS DE CONSTRUCTION POUR ATTEINDRE DES OBJECTIFS DE PERFORMANCE DE "TRES BASSE CONSOMMATION" OU "PASSIF"',
      ],
    ]);
  });

  it('prend pour sous-axe le thème posé au-dessus de chaque fiche, même en casse mixte ou dans la police du titre', () => {
    const fichePage = (index: number, banner: string, fiche: string) =>
      buildPage(index, [
        { text: banner, fontSize: 9.5 },
        { text: fiche, fontSize: 9.5 },
        {
          text: 'Gisement impacté Déchets ménagers et assimilés.',
          fontSize: 8.2,
        },
        ...body(5).map((line) => ({ ...line, fontSize: 8.2 })),
      ]);

    expect(
      titles([
        fichePage(
          0,
          'BIODECHETS (restes alimentaires et végétaux)',
          'Action 1. Organiser un service de compostage individuel'
        ),
        fichePage(
          1,
          'ORDURES MENAGERES ET ASSIMILES - OMR et Collecte sélective',
          'Action 6. Lancer une réflexion sur la tarification incitative'
        ),
        fichePage(
          2,
          'ACTIONS TRANSVERSALES - TOUS FLUX',
          'Action 11. Structurer une commande publique responsable'
        ),
      ])
    ).toEqual([
      ['orientation', 2, 'BIODECHETS (restes alimentaires et végétaux)'],
      ['fiche', 3, 'Organiser un service de compostage individuel'],
      [
        'orientation',
        2,
        'ORDURES MENAGERES ET ASSIMILES - OMR et Collecte sélective',
      ],
      ['fiche', 3, 'Lancer une réflexion sur la tarification incitative'],
      ['orientation', 2, 'ACTIONS TRANSVERSALES - TOUS FLUX'],
      ['fiche', 3, 'Structurer une commande publique responsable'],
    ]);
  });

  it('ne prend pas pour thème une phrase ou un champ au-dessus d’une fiche isolée', () => {
    expect(
      titles([
        buildPage(0, [
          { text: 'Pilote : Direction des déchets', fontSize: 12 },
          { text: 'Action 1. Organiser le compostage', fontSize: 12 },
          ...body(5),
        ]),
        buildPage(1, [
          { text: 'La collectivité a décidé de poursuivre.', fontSize: 12 },
          { text: 'Action 2. Lutter contre le gaspillage', fontSize: 12 },
          ...body(5),
        ]),
      ]).filter(([kind]) => kind !== 'fiche')
    ).toEqual([]);
  });

  it("recolle la suite d'un titre de fiche dans une autre grande police, sans avaler le titre suivant", () => {
    expect(
      titles([
        buildPage(0, [
          { text: '1- ASSURER LA GOUVERNANCE DU PCAET', fontSize: 16 },
          { text: 'ACTION 1- PILOTER ET EVALUER LE PCAET', fontSize: 16 },
          ...body(5),
        ]),
        buildPage(1, [
          {
            text: "ACTION 1 - SYSTEMATISER L'INTEGRATION DES ENERGIES RENOUVELABLES DANS LES",
            fontSize: 20,
          },
          { text: 'BATIMENTS PUBLICS', fontSize: 16 },
          ...body(5),
        ]),
      ])
    ).toEqual([
      ['orientation', 2, 'ASSURER LA GOUVERNANCE DU PCAET'],
      ['fiche', 3, 'PILOTER ET EVALUER LE PCAET'],
      [
        'fiche',
        3,
        "SYSTEMATISER L'INTEGRATION DES ENERGIES RENOUVELABLES DANS LES BATIMENTS PUBLICS",
      ],
    ]);
  });

  it('prend le titre sous « Fiche Action n°1.2 » ; ses « Action 1 – … » et celles du récapitulatif ne sont pas des fiches', () => {
    const fiche = (numero: string, titre: string[]) => [
      { text: `Fiche Action n°${numero}`, fontSize: 14 },
      ...titre.map((text) => ({ text, fontSize: 14 })),
      { text: 'o A réaliser : actions 1-2', fontSize: 10 },
      { text: 'Action 1 - Diagnostiquer et orienter', fontSize: 10 },
      ...body(2),
      { text: 'Action 2 – Accompagner et former les habitants', fontSize: 10 },
      ...body(2),
      { text: 'Pilote : Direction Prévention', fontSize: 10 },
      { text: 'Actions 1-2 x x x x x', fontSize: 10 },
      { text: 'Action 2 X', fontSize: 10 },
    ];

    expect(
      titles([
        buildPage(0, [
          { text: 'Axe 1 : Limiter les déchets verts', fontSize: 16 },
          { text: 'Action 1.1 Développer une culture de', fontSize: 10 },
          { text: 'Action 1.2 Accompagner les habitants', fontSize: 10 },
          { text: 'Axe 2 territoire (basée hors de la ville)-', fontSize: 10 },
          ...fiche('1.1', [
            'Développer une culture de l’éco-exemplarité au sein de',
            'la collectivité et des communes',
          ]),
        ]),
        buildPage(1, fiche('1.2', ['Accompagner les habitants'])),
        buildPage(2, fiche('1.3', ['Poursuivre le tri à la source'])),
      ])
    ).toEqual([
      ['axe', 1, 'Limiter les déchets verts'],
      [
        'fiche',
        3,
        'Développer une culture de l’éco-exemplarité au sein de la collectivité et des communes',
      ],
      ['fiche', 3, 'Accompagner les habitants'],
      ['fiche', 3, 'Poursuivre le tri à la source'],
    ]);
  });

  it('lit de même une fiche transcrite en Markdown : titre dessous, champs et étapes dedans', () => {
    const named = (numero: string) => [
      { text: `Fiche Action n°${numero}` },
      { text: 'Trier à la source' },
      { text: 'Pilote : Direction' },
    ];

    expect(
      titles([
        buildPage(0, named('1.1')),
        buildPage(1, named('1.2')),
        buildPage(2, [
          { text: '# Fiche Action n°1.3' },
          { text: '## Poursuivre le tri à la source des biodéchets' },
          { text: '## Cibles : les ménages' },
          { text: '## Objectifs' },
          { text: "# Descriptif de l'action" },
          { text: '### Action 5 – Faciliter la fourniture du broyat' },
        ]),
      ])
    ).toEqual([
      ['fiche', 3, 'Trier à la source'],
      ['fiche', 3, 'Trier à la source'],
      ['fiche', 3, 'Poursuivre le tri à la source des biodéchets'],
    ]);
  });

  it('garde une fiche autonome « Action 4 » après trois fiches nommées', () => {
    const named = (numero: string, titre: string) => [
      { text: `Fiche action ${numero} : ${titre}`, fontSize: 14 },
      ...body(3),
    ];
    expect(
      titles([
        buildPage(0, [
          ...named('1', 'Isoler les écoles'),
          ...named('2', 'Rénover le gymnase'),
          ...named('3', 'Changer les chaudières'),
          { text: 'Action 4 - Rénover la mairie', fontSize: 14 },
          ...body(3),
        ]),
      ])
    ).toEqual([
      ['fiche', 3, 'Isoler les écoles'],
      ['fiche', 3, 'Rénover le gymnase'],
      ['fiche', 3, 'Changer les chaudières'],
      ['fiche', 3, 'Rénover la mairie'],
    ]);
    // Ses étapes « Action 1, Action 2 » ne prolongent pas la suite des fiches.
    const withSteps = (numero: string, titre: string) => [
      ...named(numero, titre),
      { text: 'Action 1 - Diagnostiquer', fontSize: 14 },
      ...body(2),
      { text: 'Action 2 - Réaliser', fontSize: 14 },
      ...body(2),
    ];
    expect(
      titles([
        buildPage(0, [
          ...withSteps('1', 'Isoler les écoles'),
          ...withSteps('2', 'Rénover le gymnase'),
          ...withSteps('3', 'Changer les chaudières'),
        ]),
      ])
    ).toEqual([
      ['fiche', 3, 'Isoler les écoles'],
      ['fiche', 3, 'Rénover le gymnase'],
      ['fiche', 3, 'Changer les chaudières'],
    ]);
    // Après les étapes 1 et 2 de la fiche 3, « Action 4 » rompt leur suite et
    // prolonge celle des fiches : une fiche autonome, même sur une autre page.
    expect(
      titles([
        buildPage(0, [
          ...withSteps('1', 'Isoler les écoles'),
          ...withSteps('2', 'Rénover le gymnase'),
          ...withSteps('3', 'Changer les chaudières'),
        ]),
        buildPage(1, [
          { text: 'Action 4 - Rénover la mairie', fontSize: 14 },
          ...body(3),
        ]),
      ])
    ).toEqual([
      ['fiche', 3, 'Isoler les écoles'],
      ['fiche', 3, 'Rénover le gymnase'],
      ['fiche', 3, 'Changer les chaudières'],
      ['fiche', 3, 'Rénover la mairie'],
    ]);
  });

  it('garde une fiche autonome « Action 1.4 » après les fiches 1.1 à 1.3, pas leurs renvois', () => {
    const named = (numero: string, titre: string) => [
      { text: `Fiche action ${numero} : ${titre}`, fontSize: 14 },
      ...body(3),
    ];
    expect(
      titles([
        buildPage(0, [
          { text: 'Action 1.2 Rénover le gymnase', fontSize: 10 },
          ...named('1.1', 'Isoler les écoles'),
          ...named('1.2', 'Rénover le gymnase'),
          ...named('1.3', 'Changer les chaudières'),
          { text: 'Action 1.4 - Rénover la mairie', fontSize: 14 },
          ...body(3),
        ]),
      ])
    ).toEqual([
      ['fiche', 3, 'Isoler les écoles'],
      ['fiche', 3, 'Rénover le gymnase'],
      ['fiche', 3, 'Changer les chaudières'],
      ['fiche', 3, 'Rénover la mairie'],
    ]);
  });

  it('garde « Action n » pour une fiche quand le document ne titre pas ses fiches autrement', () => {
    expect(
      titles([
        buildPage(0, [
          { text: 'Fiche action n°1 : Isoler les écoles', fontSize: 14 },
          ...body(3),
          { text: 'Action 2 - Rénover la mairie', fontSize: 14 },
          ...body(3),
          { text: 'Action 3 - Changer les chaudières', fontSize: 14 },
          ...body(3),
        ]),
      ])
    ).toEqual([
      ['fiche', 3, 'Isoler les écoles'],
      ['fiche', 3, 'Rénover la mairie'],
      ['fiche', 3, 'Changer les chaudières'],
    ]);
  });

  it("ne prend pas les lignes d'un tableau récapitulatif pour des fiches", () => {
    expect(
      titles([
        buildPage(0, [
          { text: 'Axe stratégique Intitulé de l’action', fontSize: 12 },
          { text: '2.1.1 Accompagner les collectivités', fontSize: 12 },
          {
            text: '2.1.2 Accompagner les projets de construction',
            fontSize: 12,
          },
          { text: '2/ Engager', fontSize: 12 },
          { text: '2.1.3 Assurer le suivi des consommations', fontSize: 12 },
          {
            text: '2.1.4 Réduire la consommation de l’éclairage',
            fontSize: 12,
          },
          ...body(2),
        ]),
      ])
    ).toEqual([]);
  });

  it('ne prend pas un intertitre de fiche en corps de texte, entre deux fiches, pour une partie du document', () => {
    expect(
      titles([
        buildPage(0, [
          { text: 'ACTION 1- PILOTER ET EVALUER LE PCAET', fontSize: 16 },
          ...body(3),
          { text: 'Suivi et évaluation', fontSize: 12 },
          ...body(3),
        ]),
        buildPage(1, [
          { text: 'ACTION 2- FORMER LES ELUS', fontSize: 16 },
          ...body(3),
        ]),
      ])
    ).toEqual([
      ['fiche', 3, 'PILOTER ET EVALUER LE PCAET'],
      ['fiche', 3, 'FORMER LES ELUS'],
    ]);
  });

  it("ne fait pas un axe d'une ligne en majuscules quand le document nomme ses axes, sauf si elle se dit axe", () => {
    expect(
      titles([
        buildPage(0, [
          { text: 'AXE STRATEGIQUE 4 - AMELIORER LES BÂTIMENTS', fontSize: 20 },
          ...body(3),
          { text: 'ENERGETIQUE DES BATIMENTS TERTIAIRES', fontSize: 16 },
          ...body(3),
          { text: 'AXE TRANSVERSAL', fontSize: 20 },
          ...body(3),
        ]),
      ])
    ).toEqual([
      ['axe', 1, 'AMELIORER LES BÂTIMENTS'],
      ['majuscules', 2, 'ENERGETIQUE DES BATIMENTS TERTIAIRES'],
      ['majuscules', 1, 'AXE TRANSVERSAL'],
    ]);
  });

  it('garde une partie après la dernière fiche, ou sans taille de police connue', () => {
    expect(
      titles([
        buildPage(0, [
          { text: 'ACTION 1- PILOTER ET EVALUER LE PCAET', fontSize: 16 },
          ...body(3),
          { text: 'Annexes', fontSize: 12 },
          ...body(3),
        ]),
      ])
    ).toEqual([
      ['fiche', 3, 'PILOTER ET EVALUER LE PCAET'],
      ['section', 0, 'Annexes'],
    ]);
    expect(
      titles([
        buildPage(0, [
          { text: 'Action 1 : Piloter le PCAET' },
          { text: 'Un paragraphe de description.' },
          { text: 'Suivi et évaluation' },
          { text: 'Action 2 : Former les agents' },
        ]),
      ])
    ).toEqual([
      ['fiche', 3, 'Piloter le PCAET'],
      ['section', 0, 'Suivi et évaluation'],
      ['fiche', 3, 'Former les agents'],
    ]);
  });

  it('garde les fiches d’un plan compact, deux lignes de texte par action', () => {
    const action = (number: string, title: string) => [
      { text: `${number} ${title}`, fontSize: 12 },
      { text: 'Une première ligne de description de l’action.', fontSize: 12 },
      { text: 'Une seconde ligne de description de l’action.', fontSize: 12 },
    ];

    expect(
      titles([
        buildPage(0, [
          ...action('1.2.1', 'Rénover les écoles'),
          ...action('1.2.2', 'Isoler la mairie'),
          ...action('1.2.3', 'Équiper les gymnases'),
          ...action('1.2.4', 'Suivre les consommations'),
        ]),
      ]).map(([kind]) => kind)
    ).toEqual(['fiche', 'fiche', 'fiche', 'fiche']);
  });

  it('ne colle pas un chiffre clé en grand au titre de la fiche', () => {
    expect(
      titles([
        buildPage(0, [
          { text: 'ACTION 2 - RÉNOVER LES ÉCOLES', fontSize: 16 },
          { text: '2030', fontSize: 30 },
          { text: '400 000 €', fontSize: 24 },
          ...body(5),
        ]),
      ])
    ).toEqual([['fiche', 3, 'RÉNOVER LES ÉCOLES']]);
  });

  it('recolle la suite d’un titre en colonne gauche par-dessus le texte de la colonne voisine', () => {
    expect(
      titles([
        buildPage(0, [
          { text: 'ACTION 2 - ACCOMPAGNER LES', fontSize: 16, y: 100 },
          {
            text: 'texte courant de la colonne de droite, en minuscules',
            fontSize: 12,
            y: 100,
          },
          { text: 'PROJETS DE RÉNOVATION', fontSize: 16, y: 120 },
          {
            text: 'suite du texte de la colonne de droite',
            fontSize: 12,
            y: 120,
          },
          ...body(5),
        ]),
      ])
    ).toEqual([['fiche', 3, 'ACCOMPAGNER LES PROJETS DE RÉNOVATION']]);
  });
});

// Lues à l'élément : la lecture que propose la question du niveau de l'action.
describe('actions énumérées sous le titre qui les regroupe', () => {
  const fiches = (
    pages: ReturnType<typeof buildPage>[],
    format = 'pdf',
    actionLevel: ActionLevel = 'etape'
  ) =>
    segmentDocument(buildDocument(format as 'pdf' | 'docx', pages), {
      minTokens: 0,
      maxTokens: 1000,
      overlapTokens: 0,
      actionLevel,
    })
      .filter((unit) => unit.kind === 'fiche')
      .map((unit) => [unit.title, unit.headingPath.join(' > '), unit.section]);

  it('lit les puces d’un plan Word qui ne titre pas ses actions comme ses actions, après son sommaire', () => {
    expect(
      fiches(
        [
          buildPage(0, [
            { text: 'Sommaire' },
            { text: 'Axe 1 — Un territoire sobre' },
          ]),
          buildPage(1, [
            { text: '# Axe 1 — Un territoire sobre' },
            { text: '## Objectifs de l’axe 1 :' },
            { text: '## Réduire les consommations' },
            { text: "### Groupe d'actions 1.1 — Bâtiments publics" },
            { text: '- Rénover les écoles [Structurante]' },
            { text: 'Coût : ……' },
            { text: 'Calendrier : 2027' },
            { text: '- Former les agents' },
            { text: "### Groupe d'actions 1.2 — Éclairage" },
            { text: '- Éteindre la nuit' },
          ]),
        ],
        'docx'
      )
    ).toEqual([
      [
        'Rénover les écoles [Structurante]',
        '1 Un territoire sobre > 1.1 Bâtiments publics',
        undefined,
      ],
      [
        'Former les agents',
        '1 Un territoire sobre > 1.1 Bâtiments publics',
        undefined,
      ],
      ['Éteindre la nuit', '1 Un territoire sobre > 1.2 Éclairage', undefined],
    ]);
  });

  it('laisse dans le texte les puces d’un document qui titre ses fiches', () => {
    expect(
      fiches([
        buildPage(0, [
          { text: '# Axe 1 — Un territoire sobre' },
          { text: '## Fiche action 1 : Rénover les écoles' },
          { text: '- Isoler les combles' },
          { text: '- Changer les fenêtres' },
          { text: '## Fiche action 2 : Éclairer moins' },
          { text: '- Éteindre la nuit' },
        ]),
      ]).map(([title]) => title)
    ).toEqual(['1 Rénover les écoles', '2 Éclairer moins']);
  });

  it('ne lit pas de puces comme actions quand peu de titres de leur niveau s’ouvrent sur une liste', () => {
    expect(
      fiches([
        buildPage(0, [
          { text: '## 1- GESTION DE LA RESSOURCE' },
          { text: '### A 1 : Réaliser des diagnostics' },
          { text: 'Portage : Service eau' },
          { text: '### A 2 : Aider l’installation' },
          { text: '- Prise en charge à 50 %' },
          { text: '### A 3 : Animer un réseau' },
          { text: 'Portage : Service eau' },
        ]),
      ]).map(([title]) => title)
    ).toEqual([
      'A 1 : Réaliser des diagnostics',
      'A 2 : Aider l’installation',
      'A 3 : Animer un réseau',
    ]);
  });

  const action = (lettre: string, titre: string, cartouche: boolean) => [
    { text: `${lettre} – ${titre}`, fontSize: 9 },
    { text: 'Court terme Moyen terme Long terme', fontSize: 9 },
    ...(cartouche ? [{ text: 'Partenaire(s)', fontSize: 10.5 }] : []),
    ...body(3).map((line) => ({ ...line, fontSize: 9 })),
  ];
  const mesure = (
    numero: string,
    titre: string,
    lettres: string[],
    cartouche = true
  ) => [
    { text: `Mesure ${numero} : ${titre}`, fontSize: 14 },
    ...lettres.flatMap((lettre) =>
      action(lettre, `Action ${lettre} de la mesure ${numero}`, cartouche)
    ),
  ];
  const axe = { text: 'Axe 1 – Garantir le droit à se déplacer', fontSize: 16 };

  it('fait des items lettrés qui portent chacun leur cartouche les fiches, sous leur mesure et ses rappels', () => {
    expect(
      fiches([
        buildPage(0, [axe, ...mesure('1.1', 'Développer le vélo', ['A'])]),
        // La mesure rappelée en haut de page ne coupe pas son énumération.
        buildPage(1, mesure('1.1', 'Développer le vélo', ['B'])),
        buildPage(2, mesure('1.2', 'Élaborer un schéma cyclable', ['A', 'B'])),
      ]).map(([title, path]) => [title, path])
    ).toEqual([
      [
        'A Action A de la mesure 1.1',
        '1 Garantir le droit à se déplacer > 1.1 Développer le vélo',
      ],
      [
        'B Action B de la mesure 1.1',
        '1 Garantir le droit à se déplacer > 1.1 Développer le vélo',
      ],
      [
        'A Action A de la mesure 1.2',
        '1 Garantir le droit à se déplacer > 1.2 Élaborer un schéma cyclable',
      ],
      [
        'B Action B de la mesure 1.2',
        '1 Garantir le droit à se déplacer > 1.2 Élaborer un schéma cyclable',
      ],
    ]);
  });

  it('laisse dans sa fiche une énumération sans cartouche', () => {
    expect(
      fiches([
        buildPage(0, [
          axe,
          ...mesure('1.1', 'Développer le vélo', ['A', 'B'], false),
        ]),
        buildPage(
          1,
          mesure('1.2', 'Élaborer un schéma cyclable', ['A', 'B'], false)
        ),
      ]).map(([title]) => title)
    ).toEqual(['1.1 Développer le vélo', '1.2 Élaborer un schéma cyclable']);
  });

  it('garde la fiche qui ne donne qu’un cartouche, même après sa seule puce', () => {
    expect(
      fiches([
        buildPage(0, [axe, ...mesure('1.1', 'Développer le vélo', ['A'])]),
        buildPage(1, mesure('1.2', 'Élaborer un schéma cyclable', ['A'])),
      ]).map(([title]) => title)
    ).toEqual(['1.1 Développer le vélo', '1.2 Élaborer un schéma cyclable']);
  });

  it('ne prend pas pour des actions les champs d’un cartouche écrits en puces', () => {
    const fiche = (numero: string, titre: string) => [
      { text: `### ${numero} ${titre}` },
      { text: '- Pilote : Service patrimoine' },
      { text: '- Partenaires : ADEME, SDE' },
      { text: '- Calendrier : 2025-2030' },
      { text: 'La collectivité engage un programme pluriannuel.' },
    ];
    expect(
      fiches(
        [
          buildPage(0, [
            { text: '# Axe 1 — Un territoire sobre' },
            { text: '## 1. Bâtiments' },
            ...fiche('1.1', 'Rénover les bâtiments publics'),
            ...fiche('1.2', 'Éteindre l’éclairage la nuit'),
            ...fiche('1.3', 'Former les agents'),
          ]),
        ],
        'docx'
      ).map(([title]) => title)
    ).toEqual([
      '1.1 Rénover les bâtiments publics',
      '1.2 Éteindre l’éclairage la nuit',
      '1.3 Former les agents',
    ]);
  });

  it('garde ses étapes pilotées dans la fiche qui se nomme action', () => {
    const fiche = (index: number, numero: number, titre: string) =>
      buildPage(index, [
        ...(index === 0 ? [{ text: 'Axe 1 : Bâtiments', fontSize: 16 }] : []),
        { text: `Action ${numero} : ${titre}`, fontSize: 14 },
        { text: 'Sous-actions', fontSize: 10 },
        { text: '- Réaliser un diagnostic', fontSize: 10 },
        { text: 'Pilote : Communauté de communes', fontSize: 10 },
        { text: '- Lancer les travaux', fontSize: 10 },
        { text: 'Pilote : Communes', fontSize: 10 },
      ]);
    expect(
      fiches([
        fiche(0, 1, 'Rénover les écoles'),
        fiche(1, 2, 'Rénover les gymnases'),
        fiche(2, 3, 'Rénover les mairies'),
      ]).map(([title, path]) => [title, path])
    ).toEqual([
      ['1 Rénover les écoles', '1 Bâtiments'],
      ['2 Rénover les gymnases', '1 Bâtiments'],
      ['3 Rénover les mairies', '1 Bâtiments'],
    ]);
  });

  it('ne compte pas la valeur en puce d’un libellé nu comme le cartouche de la puce d’avant', () => {
    const fiche = (index: number, numero: number, titre: string) =>
      buildPage(index, [
        ...(index === 0 ? [{ text: 'Axe 1 : Habitat', fontSize: 16 }] : []),
        { text: `Mesure ${numero} : ${titre}`, fontSize: 14 },
        { text: 'Description :', fontSize: 10 },
        { text: '• Accompagner les ménages', fontSize: 10 },
        { text: 'Pilote :', fontSize: 10 },
        { text: '• Service habitat', fontSize: 10 },
        { text: 'Porteur :', fontSize: 10 },
        { text: '• Communauté de communes', fontSize: 10 },
        { text: 'Partenaires :', fontSize: 10 },
        { text: '• ADEME, ANAH', fontSize: 10 },
      ]);
    expect(
      fiches([
        fiche(0, 1, 'Rénover les logements'),
        fiche(1, 2, 'Lutter contre la vacance'),
        fiche(2, 3, 'Adapter les logements'),
      ]).map(([title]) => title)
    ).toEqual([
      '1 Rénover les logements',
      '2 Lutter contre la vacance',
      '3 Adapter les logements',
    ]);
  });

  it('arrête la liste d’ouverture au libellé nu qui ouvre la suivante', () => {
    const groupe = (numero: string, titre: string, actions: string[]) => [
      { text: `### Groupe d'actions ${numero} — ${titre}` },
      ...actions.map((action) => ({ text: `- ${action}` })),
      { text: 'Indicateurs de suivi :' },
      { text: '- Nombre de bâtiments rénovés' },
    ];
    expect(
      fiches(
        [
          buildPage(0, [
            { text: '# Axe 1 — Un territoire sobre' },
            ...groupe('1.1', 'Bâtiments publics', [
              'Rénover les écoles',
              'Former les agents',
            ]),
            ...groupe('1.2', 'Éclairage', ['Éteindre la nuit']),
          ]),
        ],
        'docx'
      ).map(([title]) => title)
    ).toEqual(['Rénover les écoles', 'Former les agents', 'Éteindre la nuit']);
  });

  it('ne prend pas les objectifs chiffrés d’un axe pour ses actions', () => {
    const axeChiffre = (numero: number, titre: string) => [
      { text: `# Axe ${numero} — ${titre}` },
      { text: '- Réduire de 30 % les consommations d’ici 2030' },
      { text: '- Couvrir 40 % des besoins par les EnR' },
      { text: `## ${numero}.1 Bâtiments` },
      { text: 'Le patrimoine compte 80 bâtiments.' },
      { text: `### ${numero}.1.1 Rénover les écoles` },
      { text: 'La collectivité engage des travaux.' },
      { text: `### ${numero}.1.2 Former les agents` },
      { text: 'Des sessions annuelles.' },
    ];
    expect(
      fiches(
        [
          buildPage(0, axeChiffre(1, 'Sobriété')),
          buildPage(1, axeChiffre(2, 'Énergies renouvelables')),
        ],
        'docx'
      ).map(([title, path]) => [title, path])
    ).toEqual([
      ['1.1.1 Rénover les écoles', '1 Sobriété > 1.1 Bâtiments'],
      ['1.1.2 Former les agents', '1 Sobriété > 1.1 Bâtiments'],
      ['2.1.1 Rénover les écoles', '2 Énergies renouvelables > 2.1 Bâtiments'],
      ['2.1.2 Former les agents', '2 Énergies renouvelables > 2.1 Bâtiments'],
    ]);
  });

  it('ne double pas les fiches qu’une orientation annonce en puces ou en lettres', () => {
    expect(
      fiches(
        [
          buildPage(0, [
            { text: '# Programme d’actions' },
            { text: '## Orientation 1 : Produire localement' },
            { text: '- Installer des maraîchers' },
            { text: '- Préserver le foncier agricole' },
            { text: '### 1.1 Installer des maraîchers' },
            { text: 'Pilote : Chambre d’agriculture' },
            { text: '### 1.2 Préserver le foncier agricole' },
            { text: 'Pilote : SAFER' },
            { text: '## Orientation 2 : Bien manger' },
            { text: 'A. Approvisionner la restauration collective' },
            { text: 'B. Lutter contre le gaspillage' },
            { text: '### 2.1 Approvisionner la restauration collective' },
            { text: 'Pilote : Service restauration' },
            { text: '### 2.2 Lutter contre le gaspillage' },
            { text: 'Pilote : Service déchets' },
          ]),
        ],
        'docx'
      ).map(([title]) => title)
    ).toEqual([
      '1.1 Installer des maraîchers',
      '1.2 Préserver le foncier agricole',
      '2.1 Approvisionner la restauration collective',
      '2.2 Lutter contre le gaspillage',
    ]);
  });

  it('ne prend pas la suite d’une phrase sur « partenaires… » pour un cartouche', () => {
    const intertitre = (numero: string, titre: string, puces: string[][]) => [
      { text: `## ${numero} ${titre}` },
      { text: 'Le territoire compte encore peu d’équipements.' },
      ...puces.flatMap(([debut, suite]) => [
        { text: `- ${debut}` },
        { text: suite },
      ]),
    ];
    expect(
      fiches(
        [
          buildPage(0, [
            { text: '# Axe 1 — Mobilités' },
            ...intertitre('1.1', 'Covoiturage', [
              [
                'Recenser les aires existantes avec les',
                'partenaires du territoire.',
              ],
              [
                'Ouvrir deux aires nouvelles avec les',
                'partenaires institutionnels.',
              ],
            ]),
            ...intertitre('1.2', 'Vélo', [
              ['Cartographier les pistes avec les', 'partenaires associatifs.'],
              ['Équiper les gares avec les', 'partenaires ferroviaires.'],
            ]),
          ]),
        ],
        'docx'
      ).map(([title]) => title)
    ).toEqual([]);
  });

  it('lit par défaut la mesure comme l’action, ses éléments restant dans son texte', () => {
    const pages = [
      buildPage(0, [axe, ...mesure('1.1', 'Développer le vélo', ['A', 'B'])]),
      buildPage(1, mesure('1.2', 'Élaborer un schéma cyclable', ['A', 'B'])),
    ];

    expect(fiches(pages, 'pdf', 'fiche').map(([title]) => title)).toEqual([
      '1.1 Développer le vélo',
      '1.2 Élaborer un schéma cyclable',
    ]);
    expect(
      segmentDocument(buildDocument('pdf', pages), {
        minTokens: 0,
        maxTokens: 1000,
        overlapTokens: 0,
      })[1].text
    ).toContain('A – Action A de la mesure 1.1');
  });

  it('demande si l’action est la mesure ou chacun de ses éléments, en proposant les éléments', () => {
    const pages = [
      buildPage(0, [axe, ...mesure('1.1', 'Développer le vélo', ['A', 'B'])]),
      buildPage(1, mesure('1.2', 'Élaborer un schéma cyclable', ['A', 'B'])),
    ];

    expect(detectActionLevelDoubt(pages)).toEqual({
      kind: 'action-level',
      etapesFrom: 'enumeration',
      axes: {
        exampleTitle: 'Garantir le droit à se déplacer',
        examplePage: 1,
        count: 1,
      },
      fiches: {
        exampleTitle: 'Développer le vélo',
        examplePage: 1,
        count: 2,
      },
      fichesWithEtapes: 2,
      etapes: {
        exampleTitle: 'Action A de la mesure 1.1',
        examplePage: 1,
        count: 4,
      },
      proposed: 'etape',
    });
  });

  it('demande aussi pour les puces d’un plan Word qui ne titre pas ses actions', () => {
    expect(
      detectActionLevelDoubt([
        buildPage(0, [
          { text: '# Axe 1 — Un territoire sobre' },
          { text: "### Groupe d'actions 1.1 — Bâtiments publics" },
          { text: '- Rénover les écoles' },
          { text: '- Former les agents' },
          { text: "### Groupe d'actions 1.2 — Éclairage" },
          { text: '- Éteindre la nuit' },
        ]),
      ])
    ).toMatchObject({
      etapesFrom: 'enumeration',
      fiches: { exampleTitle: 'Bâtiments publics', count: 2 },
      etapes: { exampleTitle: 'Rénover les écoles', count: 3 },
      proposed: 'etape',
    });
  });

  it.each([
    [
      'sans cartouche',
      [
        buildPage(0, [
          axe,
          ...mesure('1.1', 'Développer le vélo', ['A', 'B'], false),
        ]),
        buildPage(
          1,
          mesure('1.2', 'Élaborer un schéma cyclable', ['A', 'B'], false)
        ),
      ],
    ],
    [
      'quand le document titre ses fiches',
      [
        buildPage(0, [
          { text: '# Axe 1 — Un territoire sobre' },
          { text: '## Fiche action 1 : Rénover les écoles' },
          { text: '- Isoler les combles' },
          { text: '- Changer les fenêtres' },
          { text: '## Fiche action 2 : Éclairer moins' },
          { text: '- Éteindre la nuit' },
        ]),
      ],
    ],
  ])('ne demande rien pour une énumération %s', (_cas, pages) => {
    expect(detectActionLevelDoubt(pages)).toBeNull();
  });

  it('rétrograde les rappels de la mesure porteuse jusque dans un récapitulatif', () => {
    expect(
      fiches([
        buildPage(0, [axe, ...mesure('1.1', 'Développer le vélo', ['A', 'B'])]),
        buildPage(1, mesure('1.2', 'Élaborer un schéma cyclable', ['A', 'B'])),
        // Le récapitulatif redit la mesure 1.1, loin d'elle.
        buildPage(2, [
          { text: 'Mesure 1.1 : Développer le vélo', fontSize: 14 },
          ...body(2).map((line) => ({ ...line, fontSize: 9 })),
        ]),
      ]).map(([title]) => title)
    ).toEqual([
      'A Action A de la mesure 1.1',
      'B Action B de la mesure 1.1',
      'A Action A de la mesure 1.2',
      'B Action B de la mesure 1.2',
    ]);
  });
});

describe('Word : le rang du style garde la hiérarchie des titres nommés', () => {
  const corps = (n: string) => [
    { text: `Contenu de ${n} sur plusieurs mots.` },
    { text: 'Pilote : service' },
    { text: 'Partenaires : ADEME' },
  ];
  const fiches = (lines: { text: string }[]) =>
    segmentDocument(buildDocument('docx', [buildPage(0, lines)]), {
      minTokens: 0,
      maxTokens: 1000,
      overlapTokens: 0,
    })
      .filter((unit) => unit.kind === 'fiche')
      .map((unit) => [unit.title, unit.headingPath.join(' > ')]);

  it('ne prend pas un « ## Objectif 1 » pour le rappel d’un « # Enjeu 1 »', () => {
    expect(
      fiches([
        { text: '# Enjeu 1 : Sobriété énergétique' },
        { text: '## Objectif 1 : Rénover les logements' },
        { text: '### Action 1 : Guichet unique' },
        ...corps('a1'),
        { text: '# Enjeu 2 : Mobilité' },
        { text: '## Objectif 1 : Vélo' },
        { text: '### Action 2 : Pistes' },
        ...corps('a2'),
        { text: '## Objectif 2 : Covoiturage' },
        { text: '### Action 3 : Aires' },
        ...corps('a3'),
      ])
    ).toEqual([
      ['1 Guichet unique', '1 Sobriété énergétique > 1 Rénover les logements'],
      ['2 Pistes', '2 Mobilité > 1 Vélo'],
      ['3 Aires', '2 Mobilité > 2 Covoiturage'],
    ]);
  });

  it('garde en fiche une « Fiche action » au titre long', () => {
    const long =
      'Accompagner les ménages modestes et les copropriétés dans la rénovation énergétique performante de leurs logements anciens du territoire';
    expect(
      fiches([
        { text: '# Axe 1 : Habitat' },
        { text: `## Fiche action 1.1 : ${long}` },
        ...corps('a1'),
        { text: '## Fiche action 1.2 : Créer un guichet unique' },
        ...corps('a2'),
      ])
    ).toEqual([
      [`1.1 ${long}`, '1 Habitat'],
      ['1.2 Créer un guichet unique', '1 Habitat'],
    ]);
  });
});

describe('fiches données dans un cartouche « Titre de l’action »', () => {
  const fiche = (index: number, numero: string, titre: string[]) =>
    buildPage(index, [
      { text: 'Axe stratégique AXE 1 : S’adapter aux enjeux du futur' },
      { text: `Titre de l’action ${numero} ${titre[0]}` },
      ...titre.slice(1).map((text) => ({ text })),
      { text: 'Enjeux Créer une organisation capable de penser la suite.' },
      { text: 'Synthèse A. Définir un groupe de réflexion interservices' },
      { text: 'B. Elargir les missions du conseil d’exploitation' },
      { text: 'Descriptif' },
      {
        text: `Action ${numero.replace(
          '.',
          ''
        )}A. Définir un groupe de réflexion`,
      },
      { text: 'Pour organiser efficacement une réflexion interservices.' },
    ]);
  const pages = [
    buildPage(0, [
      { text: 'AXE 1 :' },
      { text: 'S’adapter aux enjeux du futur' },
    ]),
    fiche(1, '1.1', [
      'Anticiper et planifier les réponses aux défis qui',
      'viennent',
    ]),
    fiche(2, '1.2', ['Planifier les mobilités touristiques']),
    fiche(3, '1.3', ['Accompagner les acteurs du tourisme']),
  ];

  it('ouvre une fiche à chaque titre du cartouche, recollé, sans prendre « Action 1A » pour une fiche', () => {
    expect(
      detectHeadings(pages)
        .filter(({ match }) => match.kind === 'fiche')
        .map(({ match }) => [match.number, match.title])
    ).toEqual([
      ['1.1', 'Anticiper et planifier les réponses aux défis qui viennent'],
      ['1.2', 'Planifier les mobilités touristiques'],
      ['1.3', 'Accompagner les acteurs du tourisme'],
    ]);
  });

  it("range chaque fiche sous l'axe, titré par le rappel du cartouche", () => {
    const units = segmentDocument(buildDocument('pdf', pages), {
      minTokens: 0,
      maxTokens: 1000,
      overlapTokens: 0,
    });

    expect(
      units
        .filter((unit) => unit.kind === 'fiche')
        .map((unit) => [unit.title, unit.headingPath])
    ).toEqual([
      [
        '1.1 Anticiper et planifier les réponses aux défis qui viennent',
        ['1 S’adapter aux enjeux du futur'],
      ],
      [
        '1.2 Planifier les mobilités touristiques',
        ['1 S’adapter aux enjeux du futur'],
      ],
      [
        '1.3 Accompagner les acteurs du tourisme',
        ['1 S’adapter aux enjeux du futur'],
      ],
    ]);
  });
});

describe('renderUnit', () => {
  it('situe l’extrait et marque les changements de page', () => {
    const [unit] = segmentDocument(
      buildDocument('pdf', [
        buildPage(3, [{ text: 'Action 1.1.1 : Isoler' }, { text: 'Début.' }]),
        buildPage(4, [{ text: 'Suite.' }]),
      ]),
      { minTokens: 0, maxTokens: 1000, overlapTokens: 0 }
    );

    expect(renderUnit(unit, { index: 1, count: 3 })).toBe(
      '[Extrait 2/3 · pages 4–5 · fiche « 1.1.1 Isoler »]\nAction 1.1.1 : Isoler\nDébut.\n[page 5]\nSuite.'
    );
  });

  it('nomme la partie du document avant le chemin des titres', () => {
    const units = segmentDocument(
      buildDocument('pdf', [
        buildPage(0, [
          { text: "PLAN D'ACTIONS" },
          { text: 'Axe 1 : Bâtiments' },
          { text: 'Action 1.1 : Isoler' },
        ]),
      ]),
      { minTokens: 0, maxTokens: 1000, overlapTokens: 0 }
    );

    expect(renderUnit(units[2], { index: 2, count: 3 })).toBe(
      "[Extrait 3/3 · page 1 · partie « PLAN D'ACTIONS » · 1 Bâtiments · fiche « 1.1 Isoler »]\nAction 1.1 : Isoler"
    );
  });

  it('dit d’un morceau de fiche qu’il en est la suite', () => {
    const units = segmentDocument(
      buildDocument('pdf', [
        buildPage(0, [
          { text: 'Action 1.1 : Isoler' },
          ...Array.from({ length: 40 }, (_, i) => ({
            text: `Un paragraphe de description de la fiche, numéro ${i}.`,
          })),
        ]),
      ]),
      { minTokens: 0, maxTokens: 200, overlapTokens: 0 }
    );

    expect(units.length).toBeGreaterThan(1);
    expect(renderUnit(units[1], { index: 1, count: units.length })).toContain(
      '· suite de la fiche « 1.1 Isoler »]'
    );
  });
});

describe('niveau de l’action : fiche ou étape', () => {
  const fiche = (
    numero: string,
    titre: string,
    { pilotesParEtape = false } = {}
  ) => [
    { text: `Fiche Action n°${numero}`, fontSize: 14 },
    { text: titre, fontSize: 14 },
    ...(pilotesParEtape
      ? []
      : [{ text: 'Pilote : Direction Prévention', fontSize: 10 }]),
    { text: 'Action 1 - Diagnostiquer et orienter', fontSize: 10 },
    ...body(2),
    ...(pilotesParEtape ? [{ text: 'Pilote : Service A', fontSize: 10 }] : []),
    { text: 'Action 2 – Accompagner et former les habitants', fontSize: 10 },
    ...body(2),
    ...(pilotesParEtape ? [{ text: 'Pilote : Service B', fontSize: 10 }] : []),
  ];
  const plan = (options: { pilotesParEtape?: boolean } = {}) => [
    buildPage(0, [
      { text: 'Axe 1 : Limiter les déchets verts', fontSize: 16 },
      { text: 'Action 1.1 Développer une culture de', fontSize: 10 },
      { text: 'Action 1.2 Accompagner les habitants', fontSize: 10 },
      ...fiche('1.1', 'Développer une culture de l’éco-exemplarité', options),
    ]),
    buildPage(1, fiche('1.2', 'Accompagner les habitants', options)),
    buildPage(2, fiche('1.3', 'Poursuivre le tri à la source', options)),
  ];
  const titles = (headings: ReturnType<typeof detectHeadings>) =>
    headings.map(({ match }) => [match.kind, match.level, match.title]);

  it('voit le doute quand les fiches nommées détaillent leurs étapes, sans compter le récapitulatif', () => {
    expect(detectActionLevelDoubt(plan())).toEqual({
      kind: 'action-level',
      axes: {
        exampleTitle: 'Limiter les déchets verts',
        examplePage: 1,
        count: 1,
      },
      fiches: {
        exampleTitle: 'Développer une culture de l’éco-exemplarité',
        examplePage: 1,
        count: 3,
      },
      fichesWithEtapes: 3,
      etapes: {
        exampleTitle: 'Diagnostiquer et orienter',
        examplePage: 1,
        count: 6,
      },
      proposed: 'fiche',
    });
  });

  it('propose l’étape quand le document donne un pilote à chaque étape', () => {
    expect(
      detectActionLevelDoubt(plan({ pilotesParEtape: true }))?.proposed
    ).toBe('etape');
  });

  it('ne voit aucun doute sans fiches nommées ni étapes', () => {
    expect(
      detectActionLevelDoubt([
        buildPage(0, [
          { text: 'Fiche action n°1 : Isoler les écoles', fontSize: 14 },
          ...body(3),
          { text: 'Action 2 - Rénover la mairie', fontSize: 14 },
          ...body(3),
          { text: 'Action 3 - Changer les chaudières', fontSize: 14 },
          ...body(3),
        ]),
      ])
    ).toBeNull();
    expect(
      detectActionLevelDoubt([
        buildPage(0, [
          { text: 'Fiche Action n°1.1', fontSize: 14 },
          { text: 'Isoler les écoles', fontSize: 14 },
          ...body(3),
          { text: 'Fiche Action n°1.2', fontSize: 14 },
          { text: 'Rénover la mairie', fontSize: 14 },
          ...body(3),
          { text: 'Fiche Action n°1.3', fontSize: 14 },
          { text: 'Changer les chaudières', fontSize: 14 },
          { text: 'Action 1 - Une seule étape', fontSize: 10 },
          ...body(3),
        ]),
      ])
    ).toBeNull();
  });

  it('lit par défaut chaque fiche comme une action, comme avant', () => {
    expect(titles(detectHeadings(plan()))).toEqual([
      ['axe', 1, 'Limiter les déchets verts'],
      ['fiche', 3, 'Développer une culture de l’éco-exemplarité'],
      ['fiche', 3, 'Accompagner les habitants'],
      ['fiche', 3, 'Poursuivre le tri à la source'],
    ]);
  });

  it('lu à l’étape, chaque « Action N » est une fiche sous sa fiche devenue sous-axe', () => {
    expect(titles(detectHeadings(plan(), { actionLevel: 'etape' }))).toEqual([
      ['axe', 1, 'Limiter les déchets verts'],
      ['fiche', 2, 'Développer une culture de l’éco-exemplarité'],
      ['fiche', 3, 'Diagnostiquer et orienter'],
      ['fiche', 3, 'Accompagner et former les habitants'],
      ['fiche', 2, 'Accompagner les habitants'],
      ['fiche', 3, 'Diagnostiquer et orienter'],
      ['fiche', 3, 'Accompagner et former les habitants'],
      ['fiche', 2, 'Poursuivre le tri à la source'],
      ['fiche', 3, 'Diagnostiquer et orienter'],
      ['fiche', 3, 'Accompagner et former les habitants'],
    ]);
  });

  it('lu à l’étape, une fiche sans étape reste une fiche', () => {
    const pages = [
      ...plan(),
      buildPage(3, [
        { text: 'Fiche Action n°1.4', fontSize: 14 },
        { text: 'Réduire les imprimés', fontSize: 14 },
        ...body(3),
      ]),
    ];

    expect(detectActionLevelDoubt(pages)).toMatchObject({
      fiches: { count: 4 },
      fichesWithEtapes: 3,
      etapes: { count: 6 },
    });
    expect(
      titles(detectHeadings(pages, { actionLevel: 'etape' })).slice(-1)
    ).toEqual([['fiche', 3, 'Réduire les imprimés']]);
  });

  it('découpe à l’étape : une unité par étape, rangée sous sa fiche, le pilote de la fiche dans son chapeau', () => {
    const units = segmentDocument(buildDocument('pdf', plan()), {
      minTokens: 0,
      maxTokens: 1000,
      overlapTokens: 0,
      actionLevel: 'etape',
    });
    const fiches = units.filter(({ kind }) => kind === 'fiche');

    expect(
      fiches.map(({ title, headingPath }) => [title, headingPath])
    ).toEqual([
      [
        '1 Diagnostiquer et orienter',
        [
          '1 Limiter les déchets verts',
          '1.1 Développer une culture de l’éco-exemplarité',
        ],
      ],
      [
        '2 Accompagner et former les habitants',
        [
          '1 Limiter les déchets verts',
          '1.1 Développer une culture de l’éco-exemplarité',
        ],
      ],
      [
        '1 Diagnostiquer et orienter',
        ['1 Limiter les déchets verts', '1.2 Accompagner les habitants'],
      ],
      [
        '2 Accompagner et former les habitants',
        ['1 Limiter les déchets verts', '1.2 Accompagner les habitants'],
      ],
      [
        '1 Diagnostiquer et orienter',
        ['1 Limiter les déchets verts', '1.3 Poursuivre le tri à la source'],
      ],
      [
        '2 Accompagner et former les habitants',
        ['1 Limiter les déchets verts', '1.3 Poursuivre le tri à la source'],
      ],
    ]);
    const pilote = 'Pilote : Direction Prévention';
    expect(
      units.filter(
        ({ kind, text }) => kind === 'section' && text.includes(pilote)
      )
    ).toHaveLength(3);
    expect(fiches.some(({ text }) => text.includes(pilote))).toBe(false);
  });

  const etapesOf = (
    numero: string,
    titre: string,
    chapeau: { text: string; fontSize: number }[]
  ) => [
    { text: `Fiche Action n°${numero}`, fontSize: 14 },
    { text: titre, fontSize: 14 },
    ...chapeau,
    { text: 'Action 1 - Diagnostiquer et orienter', fontSize: 10 },
    ...body(2),
    { text: 'Action 2 – Accompagner et former les habitants', fontSize: 10 },
    ...body(2),
  ];
  const lireALEtape = (
    chapeau: { text: string; fontSize: number }[],
    numeros = ['1.1', '1.2', '1.3']
  ) =>
    segmentDocument(
      buildDocument(
        'pdf',
        numeros.map((numero, index) =>
          buildPage(index, [
            ...(index === 0
              ? [{ text: 'Axe 1 : Limiter les déchets verts', fontSize: 16 }]
              : []),
            ...etapesOf(numero, `Réduire les déchets ${numero}`, chapeau),
          ])
        )
      ),
      { minTokens: 0, maxTokens: 1000, overlapTokens: 0, actionLevel: 'etape' }
    );

  it('lu à l’étape, un chapeau riche en champs reste le chapeau de sa fiche', () => {
    const units = lireALEtape([
      { text: 'Pilote :', fontSize: 10 },
      { text: 'Direction Prévention', fontSize: 10 },
      { text: 'Partenaires :', fontSize: 10 },
      { text: 'Associations du territoire', fontSize: 10 },
      { text: 'Calendrier :', fontSize: 10 },
      { text: '2025-2027', fontSize: 10 },
    ]);
    const fiches = units.filter(({ kind }) => kind === 'fiche');

    expect(fiches).toHaveLength(6);
    expect(
      units.filter(
        ({ kind, text }) =>
          kind === 'section' && text.includes('Direction Prévention')
      )
    ).toHaveLength(3);
    expect(
      fiches.some(({ text }) => text.includes('Direction Prévention'))
    ).toBe(false);
  });

  it('lu à l’étape, un intertitre en majuscules du chapeau ne détache pas les étapes de leur fiche', () => {
    const units = lireALEtape([
      ...body(1),
      { text: 'LES OUTILS', fontSize: 10 },
      ...body(1),
    ]);

    expect(
      units
        .filter(({ kind }) => kind === 'fiche')
        .map(({ headingPath }) => headingPath.at(-1))
    ).toEqual([
      '1.1 Réduire les déchets 1.1',
      '1.1 Réduire les déchets 1.1',
      '1.2 Réduire les déchets 1.2',
      '1.2 Réduire les déchets 1.2',
      '1.3 Réduire les déchets 1.3',
      '1.3 Réduire les déchets 1.3',
    ]);
  });

  it('voit les étapes « Action 1, 2 » des fiches numérotées 1, 2, 3', () => {
    const pages = ['1', '2', '3'].map((numero, index) =>
      buildPage(
        index,
        etapesOf(numero, `Réduire les déchets ${numero}`, body(1))
      )
    );

    expect(detectActionLevelDoubt(pages)).toMatchObject({
      fiches: { count: 3 },
      fichesWithEtapes: 3,
      etapes: { count: 6 },
    });
  });

  it('montre l’axe de la fiche en exemple, même titré seulement par son numéro', () => {
    const pages = [
      buildPage(0, [
        { text: 'Axe 1 : Limiter les déchets verts', fontSize: 16 },
        { text: 'Axe 2', fontSize: 16 },
        ...etapesOf('2.1', 'Accompagner les habitants', body(1)),
      ]),
      buildPage(1, etapesOf('2.2', 'Réduire les imprimés', body(1))),
      buildPage(2, etapesOf('2.3', 'Poursuivre le tri', body(1))),
    ];

    expect(detectActionLevelDoubt(pages)?.axes?.exampleTitle).toBe('Axe 2');
  });
});

type Line = { text: string; fontSize?: number; y?: number };
// Le corps du texte, en 10 points, loin sous le titre.
const corps = (from: number, count = 5): Line[] =>
  Array.from({ length: count }, (_, i) => ({
    text: `Un paragraphe de corps de texte normal, numéro ${i}.`,
    fontSize: 10,
    y: from + i * 12,
  }));
const titres = (lines: Line[]) =>
  detectHeadings([buildPage(0, lines)]).map(({ match }) => [
    match.kind,
    match.title,
  ]);

describe('titre explicite qui passe à la ligne dans sa police', () => {
  it('recolle la suite en minuscule d’un titre de fiche en grande police, sans prendre le bandeau d’axe', () => {
    expect(
      titres([
        {
          text: 'Action 3 : Capitaliser les connaissances sur la faune et évaluer',
          fontSize: 14,
          y: 100,
        },
        {
          text: 'l’efficacité des actions de protection',
          fontSize: 14,
          y: 118.5,
        },
        {
          text: 'Axe stratégique 1 : Connaître le territoire',
          fontSize: 12,
          y: 160,
        },
        ...corps(200),
      ])
    ).toEqual([
      [
        'fiche',
        'Capitaliser les connaissances sur la faune et évaluer l’efficacité des actions de protection',
      ],
      ['axe', 'Connaître le territoire'],
    ]);
  });

  it('recolle une suite qui commence par une majuscule, dans la même police et à l’interligne', () => {
    expect(
      titres([
        {
          text: 'Action 21 : Décliner les Plans de Gestion',
          fontSize: 14,
          y: 100,
        },
        { text: 'Stratégique des Zones Humides', fontSize: 14, y: 118.5 },
        ...corps(160),
      ])
    ).toEqual([
      ['fiche', 'Décliner les Plans de Gestion Stratégique des Zones Humides'],
    ]);
  });

  it('ne recolle ni une ligne éloignée, ni après un point, ni un libellé de champ, ni le titre suivant', () => {
    expect(
      titres([
        {
          text: 'Action 1 – Organiser les réunions du comité',
          fontSize: 14,
          y: 100,
        },
        { text: 'Contexte du projet de territoire', fontSize: 14, y: 140 },
        {
          text: 'Action 2 – Réduire les déchets du marché.',
          fontSize: 14,
          y: 200,
        },
        { text: 'les habitants y sont associés', fontSize: 14, y: 216 },
        {
          text: 'Action 3 – Faciliter la mise en relation',
          fontSize: 14,
          y: 260,
        },
        { text: '⚙Pilote et partenaires :', fontSize: 14, y: 276 },
        { text: 'Action 4 – Revoir la signalétique', fontSize: 14, y: 320 },
        {
          text: 'Action 5 – Communiquer sur le réemploi',
          fontSize: 14,
          y: 336,
        },
        ...corps(380),
      ]).map(([, title]) => title)
    ).toEqual([
      'Organiser les réunions du comité',
      'Réduire les déchets du marché.',
      'Faciliter la mise en relation',
      'Revoir la signalétique',
      'Communiquer sur le réemploi',
    ]);
  });

  it('garde la suite en capitales seule pour un grand titre qui ne se nomme pas', () => {
    expect(
      titres([
        { text: 'RÉNOVER LE PATRIMOINE BÂTI', fontSize: 18, y: 100 },
        { text: 'des bâtiments publics exemplaires', fontSize: 18, y: 120 },
        ...corps(160),
      ])
    ).toEqual([['majuscules', 'RÉNOVER LE PATRIMOINE BÂTI']]);
  });

  it('ne recolle rien sans ordonnée, comme dans un document Word', () => {
    expect(
      titres([
        {
          text: 'Action 3 : Capitaliser les connaissances sur la faune et',
          fontSize: 14,
        },
        { text: 'l’efficacité des actions de protection', fontSize: 14 },
        ...corps(160).map(({ text }) => ({ text, fontSize: 10 })),
      ])
    ).toEqual([['fiche', 'Capitaliser les connaissances sur la faune et']]);
  });
});

describe('titre explicite en police du corps', () => {
  it('recolle une seule ligne en minuscule, à l’interligne', () => {
    expect(
      titres([
        {
          text: 'Action 30 : Informer les habitants et les entreprises locales du',
          fontSize: 10,
          y: 100,
        },
        { text: 'bâtiment', fontSize: 10, y: 113 },
        { text: 'Autres fiches actions en lien :', fontSize: 10, y: 134 },
        {
          text: 'Action 31 : Accompagner les associations pour l’achat et la mise à',
          fontSize: 10,
          y: 160,
        },
        {
          text: 'disposition de broyeurs à végétaux pour',
          fontSize: 10,
          y: 172,
        },
        { text: 'les jardiniers du territoire', fontSize: 10, y: 184 },
        ...corps(220),
      ]).map(([, title]) => title)
    ).toEqual([
      'Informer les habitants et les entreprises locales du bâtiment',
      'Accompagner les associations pour l’achat et la mise à disposition de broyeurs à végétaux pour',
    ]);
  });

  it('ne recolle pas le paragraphe qui commence par une majuscule sous l’axe', () => {
    expect(
      titres([
        {
          text: 'Axe 1 : Limiter la production de déchets verts et encourager la gestion des biodéchets en',
          fontSize: 10,
          y: 100,
        },
        { text: 'proximité', fontSize: 10, y: 114 },
        {
          text: 'L’objectif de cet axe est de réduire les déchets',
          fontSize: 10,
          y: 128,
        },
        ...corps(142),
      ])
    ).toEqual([
      [
        'axe',
        'Limiter la production de déchets verts et encourager la gestion des biodéchets en proximité',
      ],
    ]);
  });

  it('ne recolle pas la colonne voisine entrelacée sous l’interligne', () => {
    expect(
      titres([
        {
          text: 'Action 4 : Développer le compostage partagé dans les',
          fontSize: 10,
          y: 231,
        },
        { text: 'compostage, etc.).', fontSize: 10, y: 239.4 },
        ...corps(260),
      ])
    ).toEqual([['fiche', 'Développer le compostage partagé dans les']]);
  });

  it('ne prolonge pas un titre posé dans une rangée de tableau, ni coupé par une colonne collée', () => {
    expect(
      titres([
        { text: 'Axe 5 : Réduire les déchets', fontSize: 10, y: 100 },
        {
          text: '- Action ciblée auprès des activités saisonnières.',
          fontSize: 10,
          y: 100,
        },
        { text: 'produits par les activités', fontSize: 10, y: 114 },
        {
          text: 'Axe 3 Réduire le tout venant etAction 3.1 Caractériser les flux de',
          fontSize: 10,
          y: 200,
        },
        {
          text: 'renforcer le tri déchets dans la benne',
          fontSize: 10,
          y: 212,
        },
        ...corps(240),
      ])
    ).toEqual([
      ['axe', 'Réduire les déchets'],
      ['axe', 'Réduire le tout venant et'],
    ]);
  });

  it('recolle la fin en capitales d’un bandeau d’axe, sans en faire le thème des fiches', () => {
    const page = (index: number, fiche: string) =>
      buildPage(index, [
        {
          text: 'AXE 2 : SENSIBILISER LES ACTEURS ET FAVORISER LA',
          fontSize: 10,
          y: 123,
        },
        { text: 'VISIBILITE DES EFFORTS DE PREVENTION', fontSize: 10, y: 136 },
        { text: fiche, fontSize: 10, y: 157 },
        ...corps(180),
      ]);
    expect(
      detectHeadings([
        page(0, 'Action 5 : Sensibiliser les jeunes'),
        page(1, 'Action 6 : Sensibiliser les entreprises'),
      ]).map(({ match }) => [match.kind, match.title])
    ).toEqual([
      [
        'axe',
        'SENSIBILISER LES ACTEURS ET FAVORISER LA VISIBILITE DES EFFORTS DE PREVENTION',
      ],
      ['fiche', 'Sensibiliser les jeunes'],
      [
        'axe',
        'SENSIBILISER LES ACTEURS ET FAVORISER LA VISIBILITE DES EFFORTS DE PREVENTION',
      ],
      ['fiche', 'Sensibiliser les entreprises'],
    ]);
  });
});

describe('titre sous « Fiche Action n°… » et dans un cartouche', () => {
  it('prend une quatrième ligne dans la police du titre, pas en corps de texte', () => {
    const fiche = (last: Line) => [
      { text: 'Fiche Action n°3.1', fontSize: 20, y: 76 },
      {
        text: 'Caractériser et analyser les flux de déchets dans la',
        fontSize: 18,
        y: 98,
      },
      {
        text: 'benne tout venant, suivre les tonnages des autres',
        fontSize: 18,
        y: 119,
      },
      {
        text: 'bennes de tri et développer de nouvelles filières de',
        fontSize: 18,
        y: 139,
      },
      last,
      { text: 'o Action à réaliser', fontSize: 10, y: 191 },
      ...corps(220),
    ];
    expect(
      titres(fiche({ text: 'valorisation', fontSize: 18, y: 160 }))
    ).toEqual([
      [
        'fiche',
        'Caractériser et analyser les flux de déchets dans la benne tout venant, suivre les tonnages des autres bennes de tri et développer de nouvelles filières de valorisation',
      ],
    ]);
    expect(
      titres(fiche({ text: 'valorisation des déchets', fontSize: 10, y: 160 }))
    ).toEqual([
      [
        'fiche',
        'Caractériser et analyser les flux de déchets dans la benne tout venant, suivre les tonnages des autres bennes de tri et développer de nouvelles filières de',
      ],
    ]);
  });

  it('ne double pas la suite d’un axe de cartouche', () => {
    expect(
      titres([
        {
          text: 'Axe stratégique AXE 2 : Nourrir et renforcer l’offre touristique',
          fontSize: 16,
          y: 88,
        },
        {
          text: 'et culturelle représentative du territoire',
          fontSize: 16,
          y: 108,
        },
        ...corps(150),
      ])
    ).toEqual([
      [
        'axe',
        'Nourrir et renforcer l’offre touristique et culturelle représentative du territoire',
      ],
    ]);
  });
});

describe('titre explicite : ce qui ne passe pas à la ligne', () => {
  const titreDe = (lines: Line[], kind: string) =>
    titres(lines).find(([found]) => found === kind)?.[1];

  it.each([
    ['un intertitre', 'CONTEXTE ET ENJEUX'],
    ['une date', 'MARS 2025'],
    ['un organisme', 'SYNDICAT MIXTE DES TRANSPORTS'],
  ])(
    'en police du corps, ne colle pas %s en capitales sous un titre en casse de phrase',
    (_, capitales) => {
      const lines = [
        { text: 'Action 3 : Rénover les écoles', fontSize: 10, y: 100 },
        { text: capitales, fontSize: 10, y: 112 },
        ...corps(124),
      ];
      expect(titreDe(lines, 'fiche')).toBe('Rénover les écoles');
    }
  );

  it('garde le thème en capitales posé entre deux fiches', () => {
    expect(
      titres([
        { text: 'Axe 1 : Mobilité durable', fontSize: 10, y: 100 },
        { text: 'TRANSPORTS EN COMMUN', fontSize: 10, y: 112 },
        { text: 'Action 1 : Renforcer les lignes', fontSize: 10, y: 124 },
        ...corps(136),
      ])
    ).toEqual([
      ['axe', 'Mobilité durable'],
      ['majuscules', 'TRANSPORTS EN COMMUN'],
      ['fiche', 'Renforcer les lignes'],
    ]);
  });

  it.each([
    [
      'un chapeau',
      { text: 'Action 3 : Rénover les écoles', fontSize: 14, y: 100 },
      {
        text: 'Un programme pluriannuel d’investissement',
        fontSize: 14,
        y: 117,
      },
      'fiche',
      'Rénover les écoles',
    ],
    [
      'un libellé sans deux-points final',
      { text: 'Action 3 : Rénover les écoles', fontSize: 14, y: 100 },
      {
        text: 'Service porteur : Direction du patrimoine',
        fontSize: 14,
        y: 117,
      },
      'fiche',
      'Rénover les écoles',
    ],
    [
      'le nom de la collectivité',
      { text: 'Axe 2 : Se déplacer autrement', fontSize: 24, y: 100 },
      {
        text: 'Communauté d’agglomération du Pays de Grasse',
        fontSize: 24,
        y: 130,
      },
      'axe',
      'Se déplacer autrement',
    ],
  ])(
    'en grande police, ne colle pas %s dont le premier mot aurait tenu sur la ligne',
    (_, titre, suivante, kind, attendu) => {
      expect(titreDe([titre, suivante, ...corps(180)], kind)).toBe(attendu);
    }
  );
});
